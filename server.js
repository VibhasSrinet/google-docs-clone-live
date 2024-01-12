const { createServer } = require('http');
const express = require('express');
const { Server } = require('socket.io');
const mongoose = require("mongoose");
const Document = require("./Document");
const cors = require("cors")


const username = encodeURIComponent("vibhassinghvs");
const password = encodeURIComponent("MyD@7@8@53");

const PORT = process.env.PORT || 3001;

const URL = process.env.MONGODB_URL || "mongodb://localhost/google-docs-clone";
mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
}).then(() => {
  console.log("Connection to dataBase Successfull!");
}).catch(err => {
  console.log(err)
});

const app = express();

app.use(cors());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

const httpServer = createServer(app);
httpServer.listen(PORT, ()=>{
  console.log(`server is listening on ${PORT}`);
});

const io = new Server(httpServer, {cors: {origin: "*"}})

const defaultValue = ""

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}
