// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;



import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./PrizeFactory.sol";
import "./PieceFactory.sol";

contract PuzzleManager is Pausable, Ownable {
    enum PackTier {
        GOLD
    }

    // Structs
    struct Pack {
        address owner;
        uint256 puzzleGroupId;
        uint256 randomness;
        PackTier tier;
    }

    struct Puzzle {
        uint256 puzzleGroupId;
        uint256 puzzleId;
        string[] pieces;
        string[] prizes;
        uint256 winnerIndex;
        uint256 maxWinners;
    }

    struct Prize {
        string uri;
        bool claimed;
    }

    // Variables
    bool public slowMode;
    uint256 public slowModeTime;
    address DAI_TOKEN_ADDRESS = 0xe3520349F477A5F6EB06107066048508498A291b;

    // address public owner;
    mapping(address => bool) public whitelistedAddress;

    // Pack Management
    mapping(PackTier => uint256) public packPrices;
    mapping(PackTier => uint256) public packContents;
    mapping(bytes32 => Pack) public packs;

    // Puzzle Management
    uint256[] public activePuzzleGroups;
    mapping(uint256 => Puzzle[]) public puzzleGroupToOngoingPuzzles;

    // Prize Management
    // winner's address -> (PuzzleId -> Prize)
    mapping(address => mapping(uint256 => Prize)) public winningsForUser;

    // Listings Management
    // Seller -> TokenID -> CID -> Boolean
    mapping(address => mapping(uint256 => mapping(string => bool)))
        public listingsForOwner;

    // pack purchase bool for group ID
    mapping(uint256 => bool) public packPurchaseStatusForGroup;

    // timings for pack purrchase
    mapping(address => uint256) public usersTimers;


    // Children Contracts
    PrizeFactory public prizeFactory;
    PieceFactory public pieceFactory;

    // Other Contracts
    IERC20 DAI;

    // Events
    event PuzzleStarted(
        uint256 puzzleGroupId,
        uint256 puzzleId,
        uint256 maxWinners
    );
    event PuzzleEnded(uint256 puzzleGroupId, uint256 puzzleId);
    event PuzzleSolved(
        uint256 puzzleGroupId,
        uint256 puzzleId,
        address winner,
        string prize
    );
    event PackPurchaseRequested(
        uint256 puzzleGroupId,
        address buyer,
        bytes32 requestId,
        PackTier tier
    );
    event PackPurchaseCompleted(bytes32 requestId);

    event PackUnboxed(bytes32 requestId, uint256[] tokenIds);

    event PieceMinted(address owner, uint256 tokenId, string piece);
    event PrizeClaimed(address winner, uint256 tokenId, string prize);

    event ListingCreated(address seller, uint256 sellerTokenId, string wants);
    event ListingSwapped(
        address seller,
        uint256 sellerTokenId,
        address buyer,
        uint256 buyerTokenId,
        string wanted
    );
    event ListingDeleted(address seller, uint256 sellerTokenId, string wanted);

    modifier onlyWhitelisted() {
        require(
            whitelistedAddress[msg.sender] || owner() == _msgSender(),
            "PuzzleManager: must be owner to call this function"
        );
        _;
    }

    modifier onlyPieceFactory() {
        require(
            address(pieceFactory) == msg.sender,
            "PuzzleManager: Only Piece Factory can call this function"
        );
        _;
    }

    // Constructor
    constructor(address pieceFactoryAddress, address prizeFactoryAddress)  {

        whitelistedAddress[owner()] = true;

        prizeFactory = PrizeFactory(prizeFactoryAddress);

        pieceFactory = PieceFactory(pieceFactoryAddress);

        DAI = IERC20(DAI_TOKEN_ADDRESS);
    }

    // Core Logic
    /**
     * @dev Starts a new puzzle
     * @param puzzleGroupId for the puzzle where it will be created
     * @param puzzleId uniquely identifying the puzzle
     * @param pieces string array of IPFS CIDs with piece metadata
     * @param maxWinners uint256 number of winners allowed for a puzzle
     * @param prizes string[] prizes that would be won by the winners
     * Requirements:
     *  - caller must be owner
     */
    function startNewPuzzle(
        uint256 puzzleGroupId,
        uint256 puzzleId,
        string[] memory pieces,
        uint256 maxWinners,
        string[] memory prizes
    ) public onlyWhitelisted whenNotPaused {
        require(pieces.length > 0, "PuzzleManager: empty pieces array passed");
        require(prizes.length > 0, "PuzzleManager: empty prizes array passed");

        // Start new puzzle group if does not exist
        if (puzzleGroupToOngoingPuzzles[puzzleGroupId].length == 0) {
            activePuzzleGroups.push(puzzleGroupId);
        }

        Puzzle memory newPuzzle = Puzzle({
            puzzleGroupId: puzzleGroupId,
            puzzleId: puzzleId,
            pieces: pieces,
            winnerIndex: 0,
            maxWinners: maxWinners,
            prizes: prizes
        });

        puzzleGroupToOngoingPuzzles[puzzleGroupId].push(newPuzzle);

        emit PuzzleStarted(puzzleGroupId, newPuzzle.puzzleId, maxWinners);
    }

    /**
     * @dev Starts a batch of new puzzles in the same group ID
     * @param puzzleGroupId for the puzzles where they will be created
     * @param puzzleIds array of unique ID's for the puzzles
     * @param pieces array of string arrays of IPFS CIDs with piece metadata
     *
     * Requirements:
     *  - caller must be owner
     */
    function batchStartNewPuzzles(
        uint256 puzzleGroupId,
        uint256[] memory puzzleIds,
        string[][] memory pieces,
        uint256[] memory maxWinners,
        string[][] memory prizes
    ) public onlyWhitelisted whenNotPaused {
        uint256 length = puzzleIds.length;
        require(
            length == pieces.length,
            "PuzzleManager: unequal length of puzzle ids and pieces passed"
        );
        require(
            length == prizes.length,
            "PuzzleManager: unequal length of puzzle ids and prizes passed"
        );

        for (uint256 i = 0; i < length; i++) {
            startNewPuzzle(
                puzzleGroupId,
                puzzleIds[i],
                pieces[i],
                maxWinners[i],
                prizes[i]
            );
        }
    }

    /**
     * @dev Allows user to purchase a pack of a specific tier for a group
     * @param puzzleGroupId to purchase the pack for
     * @param recipient address for the pack
     * @param tier of pack to purchase
     */
    function buyPackForTier(
        uint256 puzzleGroupId,
        address recipient,
        PackTier tier
    ) public whenNotPaused returns (bytes32) {
        require(
            packPurchaseStatusForGroup[puzzleGroupId],
            "PuzzleManager: Pack purchase is currently disabled for this puzzle group ID"
        );
        // When user's time is less than block's time, allow the user to purchase a pack
        if (slowMode) {
            require(
                usersTimers[recipient] < block.timestamp,
                "PuzzleManager: SlowMode is activated please wait for required time"
            );
            usersTimers[recipient] = block.timestamp + slowModeTime;
        }

        // If the msg.sender is not whitelisted then the sender and recipient should be the same
        if (!whitelistedAddress[msg.sender]) {
            require(
                msg.sender == recipient,
                "PuzzleManager: non owners must purchase pack for themselves"
            );
            require(
                DAI.transferFrom(recipient, address(this), packPrices[tier]),
                "PuzzleManager: user has not approved contract to transfer DAI"
            );
        }

        require(
            activePuzzleGroups.length > 0,
            "PuzzleManager: no active puzzle groups"
        );
        require(
            puzzleGroupToOngoingPuzzles[puzzleGroupId].length > 0,
            "PuzzleManager: no ongoing puzzles"
        );

        return _requestPackPurchase(puzzleGroupId, tier, recipient);
    }



    /**
     * @dev Allows user to unbox a specific pack, or owner to unbox on their behalf
     * @param requestId of the VRF request
     */
    function unboxPack(bytes32 requestId)
        public
        whenNotPaused
        returns (uint256[] memory)
    {
        Pack memory pack = packs[requestId];
        require(
            pack.randomness > 0,
            "PuzzleManager: pack does not have randomness yet or does not exist"
        );
        if (!whitelistedAddress[msg.sender]) {
            require(
                msg.sender == pack.owner,
                "PuzzleManager: non owners must unbox packs they own"
            );
        }

        uint256[] memory tokenIds = generateRandomPieces(requestId);
        emit PackUnboxed(requestId, tokenIds);
        delete packs[requestId];
        return tokenIds;
    }

    /**
     */
    function getRandomNumber(uint256 puzzleGroupId) internal view whenNotPaused returns (bytes32 requestId)  {
        requestId =
            keccak256(abi.encodePacked(block.timestamp, block.timestamp, puzzleGroupId));
        return requestId;
    }

    /**
     */
    function generateRandomPieces(bytes32 requestId)
        internal
        returns (uint256[] memory)
    {
        Pack memory pack = packs[requestId];
        require(
            pack.randomness > 0,
            "PuzzleManager: pack does not have randomness assigned yet"
        );
        require(
            activePuzzleGroups.length > 0,
            "PuzzleManager: there are no active puzzle groups to unbox packs for"
        );

        Puzzle[] memory randomPuzzles = puzzleGroupToOngoingPuzzles[
            pack.puzzleGroupId
        ];
        require(
            randomPuzzles.length > 0,
            "PuzzleManager: there are no active puzzles in puzzle group"
        );

        uint256 randomness = pack.randomness;
        uint256 numPieces = packContents[pack.tier];

        uint256[] memory tokenIds = new uint256[](numPieces);

        for (uint256 i = 0; i < numPieces; i++) {
            uint256 random = uint256(keccak256(abi.encode(randomness, i)));

            // Pick random puzzle in puzzle group
            uint256 randomPuzzleIndex = random % randomPuzzles.length;
            Puzzle memory randomPuzzle = randomPuzzles[randomPuzzleIndex];

            // Pick random piece in puzzle pieces
            string[] memory randomPuzzlePieces = randomPuzzle.pieces;
            uint256 randomPieceIndex = random % randomPuzzlePieces.length;
            string memory randomPiece = randomPuzzlePieces[randomPieceIndex];

            // Mint the piece
            uint256 pieceTokenId = _mintPiece(pack.owner, randomPiece);
            tokenIds[i] = pieceTokenId;
        }

        return tokenIds;
    }

    /**
     * @dev Creates a listing on the marketplace
     * @param sellerTokenIds array of token IDs the seller is willing to swap
     * @param wants IPFS CID of the token the seller wants
     * @param seller address
     */
    function createListing(
        uint256[] memory sellerTokenIds,
        string memory wants,
        address seller
    ) public whenNotPaused {
        if (!whitelistedAddress[msg.sender]) {
            require(
                msg.sender == seller,
                "PuzzleManager: non owners can only create listings for themselves"
            );
        }
        uint256 length = sellerTokenIds.length;
        for (uint256 i = 0; i < length; i++) {
            uint256 currSellerTokenId = sellerTokenIds[i];
            require(
                pieceFactory.ownerOf(currSellerTokenId) == seller,
                "PuzzleManager: seller is not the owner of provided tokenId"
            );
            listingsForOwner[seller][currSellerTokenId][wants] = true;
            emit ListingCreated(seller, currSellerTokenId, wants);
        }
    }

    /**
     * @dev Function to transfer piece from sender to reciever
     * @param from address of the sender
     * @param to address of the reciever
     * @param tokenId tokenId for the piece to be transfered
     */
    function transferPiece(
        address from,
        address to,
        uint256 tokenId
    ) public whenNotPaused onlyWhitelisted {
        require(
            pieceFactory.ownerOf(tokenId) == from,
            "PuzzleManager: passed sender address does not own the piece ID"
        );
        pieceFactory.transferPiece(from, to, tokenId);
    }

    /**
     * @dev Fulfills an existing listing and swaps two pieces
     * @param sellerTokenId being swapped
     * @param buyerTokenId being swapped
     * @param seller address
     * @param buyer address
     */
    function fulfillListing(
        uint256 sellerTokenId,
        uint256 buyerTokenId,
        address seller,
        address buyer
    ) public whenNotPaused {
        if (!whitelistedAddress[msg.sender]) {
            require(
                msg.sender == buyer,
                "PuzzleManager: non owners can only fulfill listings for themselves"
            );
        }
        require(
            pieceFactory.ownerOf(sellerTokenId) == seller,
            "PuzzleManager: seller does not own the sellerTokenId"
        );
        require(
            pieceFactory.ownerOf(buyerTokenId) == buyer,
            "PuzzleManager: buyer does not own the buyerTokenId"
        );
        string memory buyerTokenIdTokenURI = pieceFactory.tokenURIWithoutPrefix(
            buyerTokenId
        );
        require(
            listingsForOwner[seller][sellerTokenId][buyerTokenIdTokenURI] ==
                true,
            "PuzzleManager: seller has not put up this listing"
        );

        pieceFactory.swap(sellerTokenId, buyerTokenId, seller, buyer);

        emit ListingSwapped(
            seller,
            sellerTokenId,
            buyer,
            buyerTokenId,
            buyerTokenIdTokenURI
        );
    }

    function deleteListings(
        uint256[][] memory tokenIds,
        string[] memory wanted,
        address seller
    ) public whenNotPaused {
        if (!whitelistedAddress[msg.sender]) {
            require(
                msg.sender == seller,
                "PuzzleManager: non owners can only delete their own listings"
            );
        }

        require(
            tokenIds.length == wanted.length,
            "PuzzleManager: unequal lengths of tokenIds and wanted passed"
        );

        for (uint256 i = 0; i < wanted.length; i++) {
            uint256 tokensLength = tokenIds[i].length;
            string memory cid = wanted[i];
            for (uint256 j = 0; j < tokensLength; j++) {
                uint256 tokenId = tokenIds[i][j];
                require(
                    pieceFactory.ownerOf(tokenId) == seller,
                    "PuzzleManager: seller does not own the tokenId"
                );
                listingsForOwner[seller][tokenId][cid] = false;
                emit ListingDeleted(seller, tokenId, cid);
            }
        }
    }

    /**
     * @dev Ends a given puzzle and assigns the winner, and starts a new one if a replacement is provided
     * @param puzzleGroupId for group to end (and possibly replace) the puzzle in
     * @param oldPuzzleId the puzzle id to stop
     * @param oldPuzzleWinner the address of the winner of the old puzzle
     * @param oldPuzzlePieces the IPFS CIDs array of pieces for the old puzzle
     * @param newPuzzleId the new puzzle id to start
     * @param newPuzzlePieces the IPFS CIDs array of pieces for the new puzzle
     * @param newPuzzleMaxWinners the number of winners for the new puzzle
     * @param newPuzzlePrizes Prizes for new puzzle
     */
    function replaceOrEndPuzzle(
        uint256 puzzleGroupId,
        uint256 oldPuzzleId,
        address oldPuzzleWinner,
        uint256[] memory oldPuzzlePieces,
        uint256 newPuzzleId,
        string[] memory newPuzzlePieces,
        uint256 newPuzzleMaxWinners,
        string[] memory newPuzzlePrizes
    ) public whenNotPaused onlyWhitelisted {
        Puzzle[] storage puzzles = puzzleGroupToOngoingPuzzles[puzzleGroupId];
        require(
            puzzles.length > 0,
            "PuzzleManager: puzzle group has no active puzzles"
        );

        string memory oldPuzzlePrize;

        // Ensure this puzzle is currently ongoing
        bool isOngoing = false;
        for (uint8 i = 0; i < puzzles.length; i++) {
            uint256 currPuzzleId = puzzles[i].puzzleId;
            // If found
            if (currPuzzleId == oldPuzzleId) {
                Puzzle storage puzzle = puzzles[i];
                // Require the winner hasn't already won this puzzle in the past
                require(
                    bytes(winningsForUser[oldPuzzleWinner][currPuzzleId].uri)
                        .length == 0,
                    "PuzzleManager: you have already won this puzzle"
                );

                uint256 winnerIndex = puzzle.winnerIndex;

                require(
                    winnerIndex < puzzle.maxWinners,
                    "PuzzleManager: this puzzle already has been won the max amount of times"
                );
                // Assign oldPuzzlePrize to prize at index oldPuzzleWinnersLength
                oldPuzzlePrize = puzzle.prizes[winnerIndex];

                // Assign prize to user
                winningsForUser[oldPuzzleWinner][currPuzzleId] = Prize({
                    uri: oldPuzzlePrize,
                    claimed: false
                });
                // Increment winnerIndex
                puzzle.winnerIndex = winnerIndex + 1;
                emit PuzzleSolved(
                    puzzleGroupId,
                    oldPuzzleId,
                    oldPuzzleWinner,
                    oldPuzzlePrize
                );
                // Puzzle has reached the maxWinner, end the puzzle
                if (puzzle.winnerIndex == puzzle.maxWinners) {
                    _endPuzzle(puzzleGroupId, puzzles.length, i);

                    emit PuzzleEnded(puzzleGroupId, oldPuzzleId);

                    // Start a new puzzle and replace the old puzzle
                    if (
                        newPuzzleId > 0 &&
                        newPuzzlePieces.length > 0 &&
                        newPuzzleMaxWinners > 0 &&
                        newPuzzlePrizes.length > 0
                    ) {
                        // Start new puzzle if provided
                        startNewPuzzle(
                            puzzleGroupId,
                            newPuzzleId,
                            newPuzzlePieces,
                            newPuzzleMaxWinners,
                            newPuzzlePrizes
                        );
                    }
                }
                isOngoing = true;
                break;
            }
        }
        require(isOngoing == true, "PuzzleManager: oldPuzzleId is not ongoing");

        //burn the used pieces
        _burnPieces(oldPuzzlePieces, oldPuzzleWinner);
    }

    /**
     * @dev Helper to ends a given puzzle
     * @param puzzleGroupId for group to end (and possibly replace) the puzzle in
     * @param puzzlesLength length of array of ongoing puzzles for a given group id
     */

    function _endPuzzle(
        uint256 puzzleGroupId,
        uint256 puzzlesLength,
        uint8 index
    ) private onlyWhitelisted whenNotPaused {
        // Delete the puzzle from ongoing puzzle in this group
        puzzleGroupToOngoingPuzzles[puzzleGroupId][
            index
        ] = puzzleGroupToOngoingPuzzles[puzzleGroupId][puzzlesLength - 1];
        puzzleGroupToOngoingPuzzles[puzzleGroupId].pop();

        // Delete the group, if no more puzzles left
        if (puzzleGroupToOngoingPuzzles[puzzleGroupId].length == 0) {
            for (uint256 j = 0; j < activePuzzleGroups.length; j++) {
                if (activePuzzleGroups[j] == puzzleGroupId) {
                    activePuzzleGroups[j] = activePuzzleGroups[
                        activePuzzleGroups.length - 1
                    ];
                    activePuzzleGroups.pop();
                }
            }
        }
    }

    /**
     * @dev Allows user to claim a prize
     * @param recipient address for prize winner
     * @param puzzleId Id for the puzzle
     */
    function claimPrize(address recipient, uint256 puzzleId)
        public
        whenNotPaused
    {
        if (!whitelistedAddress[msg.sender]) {
            require(
                msg.sender == recipient,
                "PuzzleManager: user can only claim prizes for themselves"
            );
        }
        Prize storage prize = winningsForUser[recipient][puzzleId];
        require(
            !prize.claimed && bytes(prize.uri).length > 0,
            "PuzzleManager: the winning does not exist or has already been claimed"
        );
        prize.claimed = true;
        uint256 tokenId = _mintPrize(recipient, prize.uri);
        emit PrizeClaimed(recipient, tokenId, prize.uri);
    }

    /**
     * @dev Helper hook to run before a piece is transfered
     * @param from address of sender
     * @param tokenId of the piece being transfered
     */
    function _beforePieceTransfer(address from, uint256 tokenId)
        external
        onlyPieceFactory
    {
        emit ListingDeleted(from, tokenId, "all");
    }

    /**
     * @dev Helper function to mint puzzle pieces
     * @param recipient address for minted piece
     * @param piece IPFS CID of piece
     */
    function _mintPiece(address recipient, string memory piece)
        internal
        returns (uint256)
    {
        uint256 tokenId = pieceFactory.mint(recipient, piece);
        emit PieceMinted(
            recipient,
            tokenId,
            pieceFactory.tokenURIWithoutPrefix(tokenId)
        );
        return tokenId;
    }

    /**
     * @dev burns the piece passed in piece IDs
     * @param pieceIds array of piece token IDs that are to be burnt
     * @param owner address for the owner of piece IDs to be burnt
     */
    function _burnPieces(uint256[] memory pieceIds, address owner)
        internal
        whenNotPaused
    {
        uint256 length = pieceIds.length;

        for (uint256 i = 0; i < length; i++) {
            require(
                pieceFactory.ownerOf(pieceIds[i]) == owner,
                "PuzzleManager: passed owner does not own the piece ID"
            );
            pieceFactory.burn(pieceIds[i]);
        }
    }

    /**
     * @param recipient address for minted piece
     * @param pieces array of piece IPFS CIDs
     */
    function airdropPieces(address recipient, string[] memory pieces)
        public
        onlyWhitelisted
        returns (uint256[] memory)
    {
        uint256 length = pieces.length;
        require(
            length > 0,
            "PuzzleManager: pieces length must be greater than 0"
        );

        uint256[] memory tokens = new uint256[](length);

        for (uint8 i = 0; i < length; i++) {
            tokens[i] = _mintPiece(recipient, pieces[i]);
        }

        return tokens;
    }

    function _requestPackPurchase(
        uint256 puzzleGroupId,
        PackTier tier,
        address recipient
    ) internal returns (bytes32) {
        bytes32 requestId = getRandomNumber(puzzleGroupId);
        Pack memory pack = Pack({
            owner: recipient,
            randomness: uint256(requestId),
            puzzleGroupId: puzzleGroupId,
            tier: tier
        });
        emit PackPurchaseRequested(puzzleGroupId, recipient, requestId, tier);
        packs[requestId] = pack;
        emit PackPurchaseCompleted(requestId);
        return requestId;
    }

    /**
     * @dev Helper function to whitelist address
     * @param whitelist Address to be added in whitelist
     *
     * Requirements:
     *  - caller must be owner
     */

    function whitelistAddress(address whitelist) public onlyWhitelisted {
        whitelistedAddress[whitelist] = true;
    }

    /**
     * @dev Helper function to remove a whitelisted address
     * @param whitelist adress
     *
     * Requirements:
     *  - caller must be owner
     */

    function removeWhitelistedAddress(address whitelist)
        public
        onlyWhitelisted
    {
        delete whitelistedAddress[whitelist];
    }

    /**
     * @dev Helper function to mint puzzle prizes
     * @param recipient address for minted prize
     */

    function _mintPrize(address recipient, string memory prize)
        internal
        returns (uint256)
    {
        uint256 tokenId = prizeFactory.mint(recipient, prize);
        return tokenId;
    }

    // Setters

    /**
     * @dev sets the pack purchase optionality on a puzzle group ID to true/false
     * @param puzzleGroupId to set the pack purchase status on
     * @param packPurchaseStatus boolean value to set for pack purchasing
     *
     * Requirements:
     *  - caller must be owner
     */
    function setPackPurchaseStatusForGroup(
        uint256 puzzleGroupId,
        bool packPurchaseStatus
    ) public onlyWhitelisted whenNotPaused {
        packPurchaseStatusForGroup[puzzleGroupId] = packPurchaseStatus;
    }

    function setSlowMode(bool setMode) public onlyWhitelisted {
        slowMode = setMode;
    }

    function setSlowModeTime(uint256 time) public onlyWhitelisted {
        slowModeTime = time;
    }

    function setPackTierPriceInWei(uint256 _packTierPriceInWei, PackTier _tier)
        public
        onlyWhitelisted
    {
        packPrices[_tier] = _packTierPriceInWei;
    }

    function setPackTierContentsSize(uint256 _size, PackTier _tier)
        public
        onlyWhitelisted
    {
        packContents[_tier] = _size;
    }

    // Pausable
    function pause() public virtual whenNotPaused onlyWhitelisted {
        _pause();
        prizeFactory.pause();
        pieceFactory.pause();
    }

    function unpause() public virtual whenPaused onlyWhitelisted {
        _unpause();
        prizeFactory.unpause();
        pieceFactory.unpause();
    }

    // Withdraw Functions
    function withdraw() public onlyWhitelisted {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawDai() public onlyWhitelisted {
        require(
            DAI.transfer(owner(), DAI.balanceOf(address(this))),
            "PuzzleManager: unable to transfer DAI"
        );
    }

    // Fallback function
    receive() external payable {}
}