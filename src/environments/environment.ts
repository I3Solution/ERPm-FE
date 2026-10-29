// Production build settings. Empty apiBaseUrl = same-origin '/api' behind a reverse proxy; set an absolute URL only when the API is on another origin (also add it to Cors:Origins).
export const environment = {
  production: true,
  apiBaseUrl: ''
};
