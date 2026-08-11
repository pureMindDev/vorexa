// Student, tutor, and centre accounts each live under a different route tree
// (their own sidebar/layout), so any link to a shared page (Messages, Feed, Live Classes)
// has to be prefixed correctly per role or it'll dead-end at a redirect.
export const messagesBasePath = (role) => {
  if (role === 'tutor') return '/tutor/messages';
  if (role === 'centre') return '/centre/messages';
  return '/messages';
};

export const liveClassesBasePath = (role) => {
  if (role === 'tutor') return '/tutor/live-classes';
  if (role === 'centre') return '/centre/live-classes';
  return '/live-classes';
};
