import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_REACT_APP_API_URL;

const api = axios.create();

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.reload(); // Atualiza a página
    }
    return Promise.reject(error);
  }
);

export const fetchPrivateData = async (call, token, attributes) => {
  try {
    const header = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
    const url =
      `${API_URL}` + call + (attributes != undefined ? attributes : "");
    const response = await api.get(url, {
      headers: header,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const postPrivateData = async (call, data, token) => {
  try {
    const header = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
    const url = `${API_URL}` + call;
    const response = await api.post(url, data, {
      headers: header,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const putPrivateData = async (call, data, token) => {
  const header = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
  const response = await api.put(`${API_URL}${call}`, data, { headers: header });
  return response.data;
};

export const deletePrivateData = async (call, token) => {
  const header = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
  const response = await api.delete(`${API_URL}${call}`, { headers: header });
  return response.data;
};
