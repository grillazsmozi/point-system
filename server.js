const express = require("express")
const { Client, marcsync } = require("marcsync")
const http = require('http');
const path = require('path');

// SYSTEM SETTINGS
const SETTINGS = {
    "users_collection": "test_users2",
    "logs_collection": "test_logs",
    "stations_collection": "test_stations",
    "settings_collection": "settings",
    "login-code": "088088",
    "admin-login-code": "326109"
}

const MS = new Client(process.env.TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6Im1hcmNzeW5jQWNjZXNzIn0.eyJkYXRhYmFzZUlkIjoiZjM2YTQwMjYtNTY3ZC00ZDFkLWFjNWUtYmMyZTAyMWNhYTA5IiwidXNlcklkIjoiMGEzMWFkM2UtNDQ5Ny00NDQwLTljNzEtMjNlMDIxMzQyYzRjIiwidG9rZW5JZCI6IjY3Y2YxODQ5NDczNWJlMDg2OWU0ZTU4ZiIsIm5iZiI6MTc0MTYyNTQxNywiZXhwIjo4ODE0MTUzOTAxNywiaWF0IjoxNzQxNjI1NDE3LCJpc3MiOiJtYXJjc3luYyJ9.0Y7fFpN9bV-ezqw2wRd5ta0pzLslZlaOiVc6KKmsx6Y")

const app = express()

let users = MS.getCollection("test_users")
let logs = MS.getCollection("test_logs")
let stations = MS.getCollection("test_stations")
let settings = MS.getCollection("settings")

app.use(express.urlencoded({ extended: true }));
app.use(express.json())

// ENDPOINTS

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

app.get("/dashboard", (req, res) => {
    res.sendFile(__dirname + "/public/dashboard.html")
})

app.get("/dashboard/users", (req, res) => {
    res.sendFile(__dirname + "/public/users.html")
})

app.get("/admin/login", (req, res) => {
    res.sendFile(__dirname + "/public/admin/login.html")
})

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/public/admin/stations.html")
})

app.get("/admin/users", (req, res) => {
    res.sendFile(__dirname + "/public/admin/users.html")
})

app.get("/admin/analytics", (req, res) => {
    res.sendFile(__dirname + "/public/admin/statistics.html")
})


app.get("/js/auth.js", (req, res) => {
    res.sendFile(__dirname + "/public/js/auth-normal.js")
})

app.get("/js/auth-admin.js", (req, res) => {
    res.sendFile(__dirname + "/public/js/auth-admin.js")
});


app.post("/api/users/register", async (req, res) => {
    try {
        const { newname, newnumber, newclass, newpoints } = req.body

        const checkAccs = await users.getEntries({ name: newname })

        if (checkAccs.length > 0) {
            res.status(400).send({ success: true, message: "Ez a felhasználó már létezik" })
        } else {
            await users.createEntry({
                name: newname,
                number: newnumber,
                class: newclass,
                points: newpoints,
                user: true,
            })

            res.json({
                success: true,
                message: "Felhasználó létrehozva!"
            })
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` })     
        console.log(error)   
    }


})

app.post("/api/stations/register", async (req, res) => {
    try {
        const { newname, newnumber, newpoints, newimage } = req.body;

        // Check for missing required fields
        if (!newname || !newnumber || !newpoints) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const checkAccs = await stations.getEntries({ name: newname });

        if (checkAccs.length > 0) {
            return res.status(400).json({ success: false, message: "Ez az állomás már létezik" });
        } else {
            await stations.createEntry({
                name: newname,
                number: newnumber,
                points: newpoints,
                image: newimage || "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
                station: true,
            });

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

app.get('/admin/station', (req, res) => {
    res.sendFile(__dirname + "/public/stations/point.html");
});


async function addPoint(userid, point) {
    const user = await users.getEntryById(userid)

    await users.updateEntries({ _id: userid }, {
        points: parseInt(user.data.points) + parseInt(point)
    })
}


app.post("/api/points/register", async (req, res) => {
    try {
        const { userid, stationid, point } = req.body;

        //console.log(userid)

        await logs.createEntry({
            userid: userid,
            stationid: stationid,
            points: "+" + point,
            log: true,
            goodLog: true
        })

        addPoint(userid, point)

        /*/await users.updateEntries({ _id: userid }, {
            points: users.getEntryById(userid).points + parseInt(point)
        })/*/

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
        const { newstationname, newstationnumber, newstationpoints, newstationimage, newstationid } = req.body

        await stations.updateEntryById(newstationid, {
            name: newstationname,
            number: newstationnumber,
            points: newstationpoints,
            image: newstationimage,
        })

        res.json({
            success: true,
            message: "Állomás létrehozva!"
        })
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` })     
        console.log(error)   
    }


})

app.post("/api/users/edit", async (req, res) => {
    try {
        const { newusername, newusernumber, newuserpoints, newuserclass, newuserid } = req.body

        await users.updateEntryById(newuserid, {
            name: newusername,
            number: newusernumber,
            points: newuserpoints,
            class: newuserclass,
        })

        await logs.createEntry({
            userid: newuserid,
            stationid: "Admin Panel",
            points: newuserpoints,
            log: true,
        })

        res.json({
            success: true,
            message: "Felhasználó frissítve."
        })
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` })     
        console.log(error)   
    }


})

app.get("/api/stations/list", async(req, res) => {
    try {
        res.send(await stations.getEntries({ station: true }))
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` })     
        console.log(error) 
    }
})

app.get("/api/logs/list", async(req, res) => {
    try {
        res.send(await logs.getEntries({ log: true }))
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` })     
        console.log(error) 
    }
})

app.get("/api/stations/get/:id", async(req, res) => {
    try {
        res.send(await stations.getEntries({ _id: req.params.id }))
    } catch (error) {
        res.status(500).json({ success: false, message: "Nem található felhasználó." })
    }
})

app.get('/api/sounds/:name', (req, res) => {
    const soundName = req.params.name;
    const filePath = path.join(__dirname, 'public', 'sounds', soundName);

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Sound not found' });
        }
    });
});

app.get("/api/users/get/:id", async(req, res) => {
    try {
        res.send(await users.getEntries({ _id: req.params.id }))
    } catch (error) {
        res.status(500).json({ success: false, message: "Nem található felhasználó." })
    }
})

app.get("/api/users/get-id/:id", async(req, res) => {
    try {
        res.send(await users.getEntries({ number: req.params.id }))
    } catch (error) {
        res.status(400).json({ success: false, message: "Nem található felhasználó." })
    }
})

app.get("/api/users/list", async(req, res) => {
    try {
        res.send(await users.getEntries({ user: true }))
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server Error` })     
        console.log(error) 
    }
})

app.get("/api/test", async(req, res) => {
    res.sendFile(__dirname + "/public/admin/test.html")
})

app.get("/api/users/delete/all", async(req, res) => {
    await users.deleteEntries({ user: true })
})

app.get("/api/users/delete/:id", async(req, res) => {
    try {
        await users.deleteEntries({ _id: req.params.id })
        res.status(200).json({ success: true, message: "Sikeres törlés!" })
    } catch (error) {
        res.status(500).json({ success: false, message: `Sikertelen törlés! (ERR_SERVER: ${error})` })
    }
})

app.delete("/api/stations/delete/:id", async(req, res) => {
    try {
        await stations.deleteEntries({ _id: req.params.id })
        res.status(200).json({ success: true, message: "Sikeres törlés!" })
    } catch (error) {
        res.status(500).json({ success: false, message: `Sikertelen törlés! (ERR_SERVER: ${error})` })
    }
})

app.delete("/api/users/delete/:id", async(req, res) => {
    try {
        await users.deleteEntries({ _id: req.params.id })
        res.status(200).json({ success: true, message: "Sikeres törlés!" })
    } catch (error) {
        res.status(500).json({ success: false, message: `Sikertelen törlés! (ERR_SERVER: ${error})` })
    }
})


app.get("/loaderio-ea430d8686d5edd4219c4a442d1e3dca.txt", (req, res) => {
    res.sendFile(__dirname + "/loaderio-ea430d8686d5edd4219c4a442d1e3dca.txt")
})

app.get("/admin/logs", (req, res) => {
    res.sendFile(__dirname + "/public/admin/logs.html")
})

app.get("/admin/settings", (req, res) => {
    res.sendFile(__dirname + "/public/admin/settings.html")
})

app.get("/api/logs/delete/all", (req, res) => {
    logs.deleteEntries({ log: true })
    res.status(200).json({ success: true, message: "Deleted all logs." })
})

app.get("/api/settings/get/:name", (req, res) => {
    const name = req.params.name
    try {
        res.send(SETTINGS[name])
    } catch (error) {
        res.status(500).json({ success: false, message: `Sikertelen lekérés (ERR_SERVER: ${error})` })
    }
})

app.post("/api/settings/post/:name/:value", (req, res) => {
    const name = req.params.name
    const value = req.params.value
    try {
        SETTINGS[name] = value
        res.status(200).json({ success: true, message: "Edited setting." })
    } catch (error) {
        res.status(500).json({ success: false, message: `Sikertelen lekérés (ERR_SERVER: ${error})` })
    }
})

/*/
/*/




//app.get("*", (req, res) => {
   // res.sendFile(__dirname + "/public/index.html")
//})


app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`)
})