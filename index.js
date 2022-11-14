import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import joi from "joi"
import dayjs from 'dayjs'

dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())
app.listen(5000, () => console.log("App rodando na porta 5000"))

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db("API_Chat-UOL");

} catch (err) {
    console.log(err);
}

const participantesJOI = joi.object({
    name: joi.string().required(),
})

const mensagensJOI = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message', 'private_message').required(),
})

app.post("/participants", async (req, res) => {

    const { name } = req.body
    const validacao = participantesJOI.validate(req.body, { abortEarly: false })
    if (validacao.err) {
        const erros = validacao.err.details.map((d) => d.message)
        res.status(422).send(erros)
        return
    }
    try {
        const usuario = await db.collection('participants').findOne({ name: name })
        if (usuario) {
            res.send(409)
            return
        }
        await db.collection('participants').insertOne({ name: name, lastStatus: Date.now() })
        await db.collection('messages').insertOne({ from: name, to: 'Todos', text: 'entrar na sala...', type: 'status', time: dayjs().format("HH:mm:ss") })
        res.send(201);

    } catch (err) {
        res.status(500).send(err.message)
    }

})

app.get("/participants", async (req, res) => {

    try {
        const participants = await db.collection("participants").find().toArray()
        res.send(participants)

    } catch (err) {
        console.log(err)
    }
})