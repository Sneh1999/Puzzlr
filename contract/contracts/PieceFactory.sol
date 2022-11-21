// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PieceFactory is
    Context,
    ERC721Enumerable,
    ERC721Burnable,
    ERC721Pausable,
    Ownable
{
    using Counters for Counters.Counter;

    string public constant IPFS_TOKEN_BASE_URI = "ipfs://";
    address managerContract;

    Counters.Counter private _tokenIdTracker;
    mapping(uint256 => string) private _tokenURIs;

    modifier onlyAdmin() {
        require(
            msg.sender == managerContract || owner() == _msgSender(),
            "PieceFactory: only the owner or manager can call this"
        );
        _;
    }

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        managerContract = msg.sender;
    }

    function swap(
        uint256 firstTokenId,
        uint256 secondTokenId,
        address firstOwner,
        address secondOwner
    ) external whenNotPaused onlyAdmin {
        _transfer(firstOwner, secondOwner, firstTokenId);
        _transfer(secondOwner, firstOwner, secondTokenId);
    }

    /**
     * @dev Creates a new token for `to`. Its token ID will be automatically
     * assigned (and available on the emitted {IERC721-Transfer} event)
     *
     * See {ERC721-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, string memory _tokenURI)
        external
        virtual
        whenNotPaused
        onlyAdmin
        returns (uint256)
    {
        uint256 tokenId = _tokenIdTracker.current();
        _mint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        _tokenIdTracker.increment();
        return tokenId;
    }

    function burn(uint256 tokenId)
        public
        virtual
        override
        whenNotPaused
        onlyAdmin
    {
        _burn(tokenId);
    }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC721Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public virtual whenNotPaused onlyAdmin {
        _pause();
    }

    /**
     * @dev Transfers token from one sender to reciever
     */

    function transferPiece(
        address from,
        address to,
        uint256 tokenId
    ) external whenNotPaused onlyAdmin {
        _transfer(from, to, tokenId);
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC721Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public virtual whenPaused onlyAdmin {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        managerContract.call(
            abi.encodeWithSignature(
                "_beforePieceTransfer(address,uint256)",
                from,
                tokenId
            )
        );
    }

    function tokenURIWithoutPrefix(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "PieceFactory: URI without prefix query for nonexistent token"
        );
        if (bytes(_tokenURIs[tokenId]).length > 0) {
            return _tokenURIs[tokenId];
        }

        return super.tokenURI(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "PieceFactory: URI query for nonexistent token"
        );
        string memory _tokenURI = string(
            abi.encodePacked(IPFS_TOKEN_BASE_URI, _tokenURIs[tokenId])
        );
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }

        return super.tokenURI(tokenId);
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI)
        internal
        virtual
        whenNotPaused
    {
        require(
            _exists(tokenId),
            "PrizeFactory: URI set for nonexistent token"
        );
        _tokenURIs[tokenId] = _tokenURI;
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }

    function updateManager(address newManagerContract)
        public
        whenNotPaused
        onlyAdmin
    {
        managerContract = newManagerContract;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}