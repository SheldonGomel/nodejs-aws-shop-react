import React from "react";
import { createRoot } from "react-dom/client";
import App from "~/components/App/App";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { theme } from "~/theme";
import axios from "axios";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: Infinity },
  },
});

// if (import.meta.env.DEV) {
//   const { worker } = await import("./mocks/browser");
//   worker.start({ onUnhandledRequest: "bypass" });
// }

export const axiosClient = axios.create();

axiosClient.interceptors.response.use(
  (response) => {
    let message = undefined;
    switch (response.status) {
      case 401:
        message = "Unauthorized";
        break;
      case 403:
        message = "Forbidden";
        break;
    }
    console.log("message = ", message);
    if (message) {
      alert(message);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.request.use(
  (config) => {
    if (config.headers) {
      const token = localStorage.getItem("authorization_token");
      if (token) {
        config.headers["Authorization"] = `Basic ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const container = document.getElementById("app");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
