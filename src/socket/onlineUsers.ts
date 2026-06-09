export const userSocketMap: Record<string, string> = {};

export const activeChatMap: Record<string, string> = {};

export const getReceiverSocketId = (
  receiverId: string,
): string | undefined => {
  return userSocketMap[receiverId];
};

export const isUserActiveInChat = (
  userId: string,
  chatId: string,
): boolean => {
  return activeChatMap[userId] === chatId.toString();
};