import dotenv from "dotenv";
// import connectDb from "./config/db";
import { server } from "./config/socket";

dotenv.config();

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  try {
    // await connectDb();

    server.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();