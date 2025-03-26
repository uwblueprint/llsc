import axios, { AxiosResponse, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';

const baseAPIClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/',
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
});

export default baseAPIClient;
