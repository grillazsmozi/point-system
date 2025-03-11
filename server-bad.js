const express = require("express");
const mongoose = require("mongoose");
const { Schema } = mongoose;

// SYSTEM SETTINGS
const SETTINGS = {
    "users_collection": "users",
    "logs_collection": "logs",
    "stations_collection": "stations"
};

const app = express();
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://ekreta_adminisztracio:admin@kreta-database.uozablb.mongodb.net/?retryWrites=true&w=majority&appName=kreta-database", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected!");
}).catch(err => {
    console.log("MongoDB connection error:", err);
});

// Define schemas for users, logs, and stations
const userSchema = new Schema({
    name: String,
    number: String,
    class: String,
    points: Number,
    user: { type: Boolean, default: true }
});

const logSchema = new Schema({
    userid: String,
    stationid: String,
    points: Number,
    log: { type: Boolean, default: true }
});

const stationSchema = new Schema({
    name: String,
    number: String,
    points: Number,
    image: String,
    station: { type: Boolean, default: true }
});

// Create models for users, logs, and stations
const User = mongoose.model('User', userSchema);
const Log = mongoose.model('Log', logSchema);
const Station = mongoose.model('Station', stationSchema);

// ENDPOINTS

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/dashboard", (req, res) => {
    res.sendFile(__dirname + "/public/dashboard.html");
});

app.get("/dashboard/users", (req, res) => {
    res.sendFile(__dirname + "/public/users.html");
});

app.get("/admin/login", (req, res) => {
    res.sendFile(__dirname + "/public/admin/login.html");
});

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/public/admin/stations.html");
});

app.get("/admin/users", (req, res) => {
    res.sendFile(__dirname + "/public/admin/users.html");
});

app.get("/admin/analytics", (req, res) => {
    res.sendFile(__dirname + "/public/admin/statistics.html");
});

app.get("/js/auth.js", (req, res) => {
    res.sendFile(__dirname + "/public/js/auth-normal.js");
});

app.get("/js/auth-admin.js", (req, res) => {
    res.sendFile(__dirname + "/public/js/auth-admin.js");
});

app.post("/api/users/register", async (req, res) => {
    try {
        const { newname, newnumber, newclass, newpoints } = req.body;

        const checkAccs = await User.find({ name: newname });

        if (checkAccs.length > 0) {
            res.status(400).send({ success: true, message: "Ez a felhasználó már létezik" });
        } else {
            const newUser = new User({
                name: newname,
                number: newnumber,
                class: newclass,
                points: newpoints
            });
            await newUser.save();

            res.json({
                success: true,
                message: "Felhasználó létrehozva!"
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` });
        console.log(error);
    }
});

app.post("/api/stations/register", async (req, res) => {
    try {
        const { newname, newnumber, newpoints, newimage } = req.body;

        // Check for missing required fields
        if (!newname || !newnumber || !newpoints) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const checkAccs = await Station.find({ name: newname });

        if (checkAccs.length > 0) {
            return res.status(400).json({ success: false, message: "Ez az állomás már létezik" });
        } else {
            const newStation = new Station({
                name: newname,
                number: newnumber,
                points: newpoints,
                image: newimage || "https://static.vecteezy.com/system/resources/previews/027/231/654/non_2x/illustration-graphic-of-aesthetic-background-template-with-simple-and-minimalist-pastel-colors-vector.jpg"
            });
            await newStation.save();

            return res.status(201).json({
                success: true,
                message: "Állomás létrehozva!"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.post("/api/points/register", async (req, res) => {
    try {
        const { userid, stationid, point } = req.body;

        // Check for missing required fields
        if (!userid || !stationid || !point) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        console.log(`${userid} | ${stationid} | ${point}`);

        // Create log entry
        const newLog = new Log({
            userid: userid,
            stationid: stationid,
            points: point
        });
        await newLog.save();

        console.log("logged");

        let user = await User.findById(userid);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let currentPoints = parseInt(user.points);
        if (isNaN(currentPoints)) {
            return res.status(400).json({ success: false, message: "Invalid points in user data" });
        }

        console.log(currentPoints);

        currentPoints += parseInt(point);

        console.log(currentPoints);

        user.points = currentPoints;
        await user.save();

        res.json({
            success: true,
            message: "Feljegyzés létrehozva!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.post("/api/stations/edit", async (req, res) => {
    try {
        const { newstationname, newstationnumber, newstationpoints, newstationimage, newstationid } = req.body;

        await Station.findByIdAndUpdate(newstationid, {
            name: newstationname,
            number: newstationnumber,
            points: newstationpoints,
            image: newstationimage
        });

        res.json({
            success: true,
            message: "Állomás frissítve!"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` });
        console.log(error);
    }
});

app.post("/api/users/edit", async (req, res) => {
    try {
        const { newusername, newusernumber, newuserpoints, newuserclass, newuserid } = req.body;

        await User.findByIdAndUpdate(newuserid, {
            name: newusername,
            number: newusernumber,
            points: newuserpoints,
            class: newuserclass
        });

        res.json({
            success: true,
            message: "Felhasználó frissítve."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` });
        console.log(error);
    }
});

app.get("/api/stations/list", async (req, res) => {
    const stations = await Station.find({ station: true });
    res.send(stations);
});

app.get("/api/logs/list", async (req, res) => {
    const logs = await Log.find({ log: true });
    res.send(logs);
});

app.get("/api/stations/get/:id", async (req, res) => {
    try {
        const station = await Station.findById(req.params.id);
        res.send(station);
    } catch (error) {
        res.status(500).json({ success: false, message: "Nem található állomás." });
    }
});

app.get("/api/users/get/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.send(user);
    } catch (error) {
        res.status(500).json({ success: false, message: "Nem található felhasználó." });
    }
});

app.get("/api/users/list", async (req, res) => {
    const users = await User.find({ user: true });
    res.send(users);
});

app.delete("/api/users/delete/:id", async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Sikeres törlés!" });
    } catch (error) {
        res.status(500).json({ success: false, message: `Sikertelen törlés! (ERR_SERVER: ${error})` });
    }
});

app.delete("/api/stations/delete/:id", async (req, res) => {
    try {
        await Station.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Sikeres törlés!" });
    } catch (error) {
        res.status(500).json({ success: false, message: `Sikertelen törlés! (ERR_SERVER: ${error})` });
    }
});

// Starting the server
app.listen(process.env.PORT || 3000, "192.168.1.156", () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
