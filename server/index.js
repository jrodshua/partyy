const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("partyEnded");
  });

  socket.on("startParty", (data) => {
    io.to(data.startPartyWith).emit("startParty", {
      signal: data.signalData,
      from: data.from,
      tag: data.tag,
    });
  });

  socket.on("joinParty", (data) => {
    io.to(data.to).emit("joinedParty"), data.signal;
  });
});

server.listen(1234, () =>
  console.log("server successfully running at port 1234")
);
