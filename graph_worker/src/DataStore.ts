import axios, { AxiosInstance } from "axios";
import { print } from "graphql";

export class Datastore {
  private hasuraAPILink: string;
  private apiInstance: AxiosInstance;

  constructor(_apiLink: string) {
    this.hasuraAPILink = _apiLink;
    this.apiInstance = axios.create({
      baseURL: this.hasuraAPILink,
      headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
      },
    });
  }

  async queryOrMutation(query: any, variables = {}) {
    try {
      const res = await this.apiInstance.post("", {
        query: print(query),
        variables: variables,
      });

      if (res.data.errors) {
        throw res.data.errors;
      }

      return res.data.data;
    } catch (e) {
      throw e;
    }
  }
}
