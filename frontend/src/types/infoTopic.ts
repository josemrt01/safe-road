// Which reference the info dialog shows, opened from the top bar; used by App, TopBar and InfoDialog.
export const InfoTopic = {
  // The risk levels, the heavy-load rules and how a route is picked.
  RISK: 'risk',
  // What Safe Road does, how to use it and where its data comes from.
  ABOUT: 'about',
} as const

export type InfoTopic = (typeof InfoTopic)[keyof typeof InfoTopic]
