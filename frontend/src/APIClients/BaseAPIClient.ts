import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
// Fix this import
import { jwtDecode } from "jwt-decode";
import { camelizeKeys, decamelizeKeys } from "humps";

import AUTHENTICATED_USER_KEY from "../constants/AuthConstants";
import { setLocalStorageObjProperty } from "../utils/LocalStorageUtils";

import { DecodedJWT } from "../types/AuthTypes";

const baseAPIClient = axios.create({
  // TODO: Fix this
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:8000",
});

// Python API uses snake_case, frontend uses camelCase
// convert request and response data to/from snake_case and camelCase through axios interceptors
// python {
baseAPIClient.interceptors.response.use((response: AxiosResponse) => {
  if (
    response.data &&
    response.headers["content-type"] === "application/json"
  ) {
    response.data = camelizeKeys(response.data);
  }
  return response;
});
// } python

baseAPIClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const newConfig = { ...config };

  // if access token in header has expired, do a refresh
  const authHeaderParts = config.headers.Authorization?.toString().split(" ");
  if (
    authHeaderParts &&
    authHeaderParts.length >= 2 &&
    authHeaderParts[0].toLowerCase() === "bearer"
  ) {
    const decodedToken = jwtDecode(authHeaderParts[1]) as DecodedJWT;

    if (
      decodedToken &&
      (typeof decodedToken === "string" ||
        decodedToken.exp <= Math.round(new Date().getTime() / 1000))
    ) {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const accessToken = data.accessToken || data.access_token;
      setLocalStorageObjProperty(
        AUTHENTICATED_USER_KEY,
        "accessToken",
        accessToken,
      );

      newConfig.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  // python {
  if (config.params) {
    newConfig.params = decamelizeKeys(config.params);
  }
  if (config.data && !(config.data instanceof FormData)) {
    newConfig.data = decamelizeKeys(config.data);
  }
  // } python

  return newConfig;
});

export default baseAPIClient;