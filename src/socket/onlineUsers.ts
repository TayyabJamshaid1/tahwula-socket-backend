export const userSocketMap: Record<
  string,
  string
> = {};

export const getReceiverSocketId = (
  receiverId: string
): string | undefined => {
  return userSocketMap[receiverId];
};
