/**
 * Utility for generating consistent, bidirectional conversation IDs between any 2 users
 */
export const getConversationId = (email1, email2) => {
  if (!email1 || !email2) return 'conv_general';
  const clean1 = String(email1).toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '');
  const clean2 = String(email2).toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '');
  return clean1 < clean2 ? `conv_${clean1}_${clean2}` : `conv_${clean2}_${clean1}`;
};
