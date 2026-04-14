import axios from "axios";
const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((c) => { const t = localStorage.getItem("vv_token"); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

// Auth
export const login = (d) => API.post("/auth/login", d);
export const register = (d) => API.post("/auth/register", d);
export const getMe = () => API.get("/auth/me");

// Discogs
export const discogsSearch = (p) => API.get("/discogs/search", { params: p });
export const discogsRelease = (id) => API.get(`/discogs/release/${id}`);
export const discogsMaster = (id) => API.get(`/discogs/master/${id}`);
export const discogsMasterVersions = (id, p) => API.get(`/discogs/master/${id}/versions`, { params: p });
export const discogsArtist = (id) => API.get(`/discogs/artist/${id}`);
export const discogsArtistReleases = (id, p) => API.get(`/discogs/artist/${id}/releases`, { params: p });
export const discogsLabel = (id) => API.get(`/discogs/label/${id}`);
export const discogsLabelReleases = (id, p) => API.get(`/discogs/label/${id}/releases`, { params: p });
export const discogsPricing = (id) => API.get(`/discogs/pricing/${id}`);
export const discogsImport = (id, data) => API.post(`/discogs/import/${id}`, data || {});
export const getTracklist = (id) => API.get(`/discogs/tracklist/${id}`);

// Collection
export const getCollection = (p) => API.get("/collection", { params: p });
export const addToCollection = (d) => API.post("/collection", d);
export const updateCollectionItem = (id, d) => API.put(`/collection/${id}`, d);
export const removeFromCollection = (id) => API.delete(`/collection/${id}`);
export const getWishlist = () => API.get("/collection/wishlist");
export const addToWishlist = (d) => API.post("/collection/wishlist", d);
export const removeFromWishlist = (id) => API.delete(`/collection/wishlist/${id}`);

// Marketplace
export const getListings = (p) => API.get("/marketplace", { params: p });
export const createListing = (d) => API.post("/marketplace", d);
export const buyListing = (id) => API.put(`/marketplace/${id}/buy`);
export const completeSale = (id) => API.put(`/marketplace/${id}/complete`);
export const cancelListing = (id) => API.put(`/marketplace/${id}/cancel`);

// Analytics
export const getAnalyticsSummary = () => API.get("/analytics/summary");
export const getAnalyticsGenres = () => API.get("/analytics/genres");
export const getAnalyticsTopValuable = (l) => API.get("/analytics/top-valuable", { params: { limit: l } });
export const getAnalyticsDecades = () => API.get("/analytics/decades");
export const getAnalyticsConditions = () => API.get("/analytics/conditions");

export default API;
