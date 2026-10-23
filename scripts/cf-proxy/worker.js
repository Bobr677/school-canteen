const UPSTREAM = "https://school-canteen-psi.vercel.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    return fetch(UPSTREAM + url.pathname + url.search, request);
  }
};
