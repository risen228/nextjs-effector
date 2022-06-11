export const paths = {
  home: () => `/`,
  me: () => `/profile`,
  profile: (id: `:id`) => `/profile/${id}`,
  about: () => `/about`,
  aboutSSG: () => `/about-ssg`,
}
