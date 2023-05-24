const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
var mysql = require('mysql');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
});


// Middleware để xử lý CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use('', express.static('public'));




// Định tuyến để trả về file index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// // insert record
// var sQuery = "INSERT INTO empleados VALUES(?,?,?,?)";
// connection.query(sQuery, ['', 'qduc ', 'Seven', '123454'], function(error, rows, fields) {
//     if (error) {
//         console.log("error" + error.message);
//     } else {
//         console.log('oke')
//     }
// });


// Xử lý sự kiện khi có kết nối từ client
io.on('connection', (socket) => {
    console.log('Client connected');

    const showStatus = () =>{
        let sQueryOpStatus = `SELECT id, description FROM status_code`;
        connection.query(sQueryOpStatus, (error, results) => {
            console.log(sQueryOpStatus)
            console.log(results)
            if (error) throw error;
            // Gửi dữ liệu về client
            socket.emit('showStatus', results);
        });
    }
  
    showStatus();
    
    const showParkingArena = () =>{
        let sQueryOpStatus = `SELECT DISTINCT idParkArena,parkName FROM parking_arena`;
        connection.query(sQueryOpStatus, (error, results) => {
            console.log(sQueryOpStatus)
            console.log(results)
            if (error) throw error;
            // Gửi dữ liệu về client
            socket.emit('showParkingArena', results);
        });
    }
  
    showParkingArena();


    // Xử lý sự kiện khi nhận được yêu cầu lấy dữ liệu từ client
    socket.on('data', (data) => {
        // console.log(data)
        const opStatus = data.opStatus;  // trạng thái
        const opParkingArena = data.opParkingArena; // hiển thị 
        const opEntries = data.opEntries; // bãi đỗ
        let sQueryAll = `SELECT main_table.*, status_code.description, parking_arena.*
            FROM main_table 
            LEFT JOIN status_code ON main_table.cStatus = status_code.sId 
            INNER JOIN parking_arena ON main_table.id = parking_arena.id
            WHERE main_table.cStatus = status_code.sId 
            AND (${opParkingArena} = 0 OR main_table.cParkArena = ${opParkingArena})
            AND (${opStatus} = 0 OR main_table.cStatus = ${opStatus})
            ORDER BY main_table.id, main_table.cName ASC 
            LIMIT ${opEntries}
            `;
        connection.query(sQueryAll, (error, results) => {
            // console.log(sQuery)
            if (error) throw error;
            // Gửi dữ liệu về client
            socket.emit('data', results);
        });

    });

    // Xử lý sự kiện khi client ngắt kết nối
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Chạy server lắng nghe cổng 3000
server.listen(3000, () => {
    console.log('Server started on port 3000');
});