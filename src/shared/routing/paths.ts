export const paths = {
  home: () => `/`,
  me: () => `/profile`,
  profile: (id: `:id`) => `/profile/${id}`,
  about: () => `/about`,
  blog: () => `/blog`,
  blogPost: (slug = ':slug') => `/blog/${slug}`,
}
