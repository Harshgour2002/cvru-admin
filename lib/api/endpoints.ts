export const endpoints = {
  auth: {
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    logout: "/api/auth/logout",
    signup: "/api/auth/signup",
  },
  events: {
    base: "/api/v1/events",
    upcoming: "/api/v1/events/upcoming",
  },
  news: {
    base: "/api/v1/news-latest",
  },
  courses: {
    base: "/api/v1/courses",
  },
  sports: {
    base: "/api/v1/sports",
  },
};
