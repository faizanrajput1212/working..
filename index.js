const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken')
const app = express();
const bycrypt = require('bcrypt')
const multer = require('multer');
const FTPClient = require('ftp');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
app.use(express.json());

JWT_SECRET = 'vsjvdvjsnaifhgubwregevhbvdhbvnbdvbhbhbhb'
const dbConfig = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
};


const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });
app.use(cors()); // Enable CORS
const pool = mysql.createPool(dbConfig);

async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    console.log('Database connection is active');
    connection.release(); // Release the connection back to the pool
  } catch (err) {
    console.error('Error pinging database:', err);
  }
}

checkConnection();
const ftpConfig = {
  host: process.env.FHOST,
  user: process.env.FUSER,
  password: process.env.FPASSWORD,
};
const client = new FTPClient();
const checkFtpConnection = () => {
  client.on('ready', () => {
    console.log('Connected to FTP server');
    client.end(); // Close the connection
  });
  client.on('error', (error) => {
    console.error('Failed to connect:', error.message);
  });

  // Connect to the FTP server
  client.connect(ftpConfig);
};

checkFtpConnection();



app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const client = new FTPClient();

  client.on('ready', () => {
    const remotePath = `/uploads/fees/${req.file.originalname}`; // Set your remote path

    // Upload the file from memory
    client.put(req.file.buffer, remotePath, (err) => {
      if (err) {
        console.error('Error uploading to FTP:', err);
        return res.status(500).send('Error uploading file to FTP.');
      }
      console.log('File uploaded to FTP successfully:', remotePath);
      client.end(); // Close the connection
      return res.status(200).send(`File uploaded successfully: ${req.file.originalname}`);
    });
  });

  client.on('error', (err) => {
    console.error('FTP connection error:', err);
    return res.status(500).send('FTP connection error.');
  });

  client.connect(ftpConfig);
});


JWT_SECRET = " dvabjhvnksdm!!!vmdfbsdvjbnsdrfnghweng"


app.get('/authentication/:id', async (req, res) => {
  const std_id = req.params.id;
  const token = jwt.sign({ std_id }, JWT_SECRET);
  console.log(token)
  if (res.status(201)) {
    return res.send({ status: 'ok', mine: token })
  }
})
app.get('/api/fees/:id/:client', async (req, res) => {
  const fk_student_id = req.params.id;
  const client = req.params.client;
  let cal = 0;
  try {
    const [results] = await pool.execute(`SELECT * FROM student_fee WHERE fk_student_id = ? AND fk_client_id = ?`, [fk_student_id, client]);
    results.map((data) => {
      cal = cal + data.pending_dues;
      data.totaldues = cal;
      const datastring = `'${data.due_date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;
      data.due_date = formattedDate;
    }
    )
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});
app.get('/schoolname/:id', async (req, res) => {
  const client_id = req.params.id;
  console.log("School name: " + client_id);
  try {
    const [results] = await pool.execute(`SELECT * FROM school_profile_ WHERE client_id=?`, [client_id]);
    if (results.length > 0) {
      results.map((data) => {
        data.image = `https://myschoolsystem.net/uploads/school-profile-uploads/${data.image}`
      })
    }
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});
app.get('/buying/:id/:std', async (req, res) => {
  const client_id = req.params.id;
  const fk_student_id = req.params.std;
  console.log("School name: " + client_id);
  try {
    const [results] = await pool.execute(`UPDATE student_subscriptions SET sub_status = 'requested' WHERE fk_client_id =? and fk_student_id = ?`, [client_id, fk_student_id]);

    console.log(results);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});
app.get('/api/request/:id/:status/:date', async (req, res) => {
  const fk_student_id = req.params.id;
  const status = req.params.status;
  const date = req.params.date;
  let cal = 0;
  try {
    const [results] = await pool.execute(`UPDATE student_fee SET fee_status=?,fee_method='cash' , payment_date=? WHERE fk_student_id=?`, [status, date, fk_student_id]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});
app.get('/api/onlinerequest/:date/:id/:image/:status', async (req, res) => {
  const fk_student_id = req.params.id;
  const date = req.params.date;
  const image = req.params.image;
  const status = req.params.status;
  try {
    const [results] = await pool.execute(
      `UPDATE student_fee SET fee_status = ?, fee_method = 'online', payment_date = ?, receipt_image = ? WHERE fk_student_id = ?`,
      [status, date, image, fk_student_id]
    );
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});
app.get('/api/teacherlogin/:id/:phone/:pass', async (req, res) => {
  const id = req.params.id;
  const phone = req.params.phone;
  const pass = req.params.pass;
  console.log(` Teacher ID is ${id} Teacher Phone is ${phone}  Teacher password is ${pass}`)
  try {
    const [results] = await pool.execute(`SELECT * FROM teacher_profile WHERE school_id=? AND phone_no=? AND password=?`, [id, phone, pass]);
    if (results.length > 0) {
      results.map((data) => {
        data.image = `https://myschoolsystem.net/uploads/teachers-profile/${data.image}`
      })
    }
    res.json(results)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});
app.get('/studentprofile/:id/:client', async (req, res) => {
  const stdid = (req.params.id);
  const clientid = (req.params.client);
  try {
    const [results] = await pool.execute(`SELECT * FROM all_classes INNER JOIN class_sections ON all_classes.class_id = class_sections.fk_class_id INNER JOIN student_class ON class_sections.section_id = student_class.fk_section_id INNER JOIN student_profile ON student_class.fk_student_id =student_profile.student_id WHERE student_id = ? AND student_profile.fk_client_id=? AND status='1'`, [stdid, clientid]);
    results.map((data) => {
      const datastring = `'${data.dob}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;
      data.dob = formattedDate
      data.image = `https://myschoolsystem.net/uploads/students-profile/${data.image}`;
    }
    )
    console.log("CAll")
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/progressstudent/:id', async (req, res) => {
  const stdid = (req.params.id);
  try {
    const [results] = await pool.execute(`SELECT * FROM progress_report WHERE fk_student_id=?`, [stdid]);
    results.map((data) => {
      const datastring = `'${data.date}'`
      const date = new Date(datastring);
      const day = date.getDate();
      data.date = day
    })
    res.send(results)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})

app.get('/student/timetable/:id', async (req, res) => {
  const stdid = (req.params.id);
  try {
    const [results] = await pool.execute(`SELECT * FROM timetable INNER JOIN periods ON timetable.timetable_id = periods.fk_timetable_id WHERE timetable.fk_section_id=?`, [stdid]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/subscription/:client/:id', async (req, res) => {
  const stdid = req.params.id;
  const stdclient = req.params.client;
  const currentDate = new Date();
  const expiryDate = new Date(currentDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const formatDate = (date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const current = formatDate(currentDate);
  const expiry = formatDate(expiryDate);

  try {
    const [subscriptions] = await pool.execute(
      'SELECT * FROM student_subscriptions WHERE fk_client_id = ? AND fk_student_id = ?',
      [stdclient, stdid]
    );

    if (subscriptions.length > 0) {
      subscriptions.forEach((data) => {
        if (data.sub_status === 'on') {
          const expiryDate = new Date(data.sub_expiry);
          const formattedExpiry = formatDate(expiryDate);
          data.sub_expiry = formattedExpiry;
          data.status = formattedExpiry > current ? "SubActive" : "SubExpired";
        } else if (data.sub_status === 'off') {
          data.status = "SubSuspended";
        } else if (data.sub_status === 'requested') {
          data.status = "SubRequested";
        }
      });
      return res.json(subscriptions);
    }

    const [trials] = await pool.execute(
      'SELECT * FROM student_trials WHERE fk_client_id = ? AND fk_student_id = ?',
      [stdclient, stdid]
    );

    if (trials.length > 0) {
      trials.forEach((data) => {
        const trialExpiryDate = new Date(data.trial_expiry);
        const formattedTrialExpiry = formatDate(trialExpiryDate);
        data.trial_expiry = formattedTrialExpiry;
        data.status = formattedTrialExpiry > current ? "TrialActive" : "TrialExpired";
      });
      return res.json(trials);
    }

    await pool.execute(
      'INSERT INTO student_trials (fk_client_id, fk_student_id, trial_expiry) VALUES (?, ?, ?)',
      [stdclient, stdid, expiry]
    );
    return res.json({ message: 'Trial created successfully', trial_expiry: expiry });

  } catch (error) {
    console.error('Error fetching subscriptions or trials:', error);
    return res.status(500).json({ message: 'Error fetching subscriptions or trials' });
  }
});
app.get('/trial/:client/:id', async (req, res) => {
  const stdid = (req.params.id);
  const stdclient = (req.params.client);
  try {
    const [results] = await pool.execute(`SELECT * FROM student_trials WHERE fk_client_id=? and fk_student_id=?`, [stdclient, stdid]);
    if (results.length > 0) {
      results.map((data) => {
        const datastring = `'${data.trial_expiry}'`
        const dateObj = new Date(datastring);
        const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
        console.log(formattedDate);
        data.trial_expiry = formattedDate;
      })
    }
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/BUY/:client/:id/:date', async (req, res) => {
  const stdid = (req.params.id);
  const stdclient = (req.params.client);
  const expiry = (req.params.date);
  try {
    const [results] = await pool.execute(
      `INSERT INTO student_trials (fk_client_id, fk_student_id, trial_expiry) VALUES (?, ?, ?)`,
      [stdclient, stdid, expiry]
    );
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/school/:client/:id', async (req, res) => {
  try {
    const [results] = await pool.execute(`select * from student_trials where fk_student_id =? AND fk_client_id =?`,[req.params.id, req.params.client]);
    if (results.length > 0) {
      results.map((data) => {
        const datastring = `'${data.trial_expiry}'`
        const dateObj = new Date(datastring);
        const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
        console.log(formattedDate);
        data.trial_expiry = formattedDate;
      })
    }
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/show/timetable/:id/:client', async (req, res) => {
  const stdid = (req.params.id);
  const client = (req.params.client);
  try {
    const [results] = await pool.execute(`SELECT * FROM homework_diary WHERE fk_section_id=? and fk_client_id=?`,[stdid,client]);
    results.map((data) => {
      const datastring = `'${data.date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.date = formattedDate;
      const formattedDate1 = `${dateObj.getDate().toString()}`;
      data.datesingle = formattedDate1;
      const formattedDate2 = `${(dateObj.getMonth() + 1).toString()}`;
      data.month = formattedDate2;
      const formattedDate3 = `${dateObj.getFullYear()}`;
      data.year = formattedDate3;

    })
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/studentprofile/timetable/:id', async (req, res) => {
  const stdid = (req.params.id);
  try {
    const [results] = await pool.execute(`SELECT section_id FROM all_classes INNER JOIN class_sections ON all_classes.class_id = class_sections.fk_class_id INNER JOIN student_class ON class_sections.section_id = student_class.fk_section_id INNER JOIN student_profile ON student_class.fk_student_id =student_profile.student_id WHERE student_id = ? AND status='1'`,[stdid]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/timetable/:id', async (req, res) => {
  const stdid = (req.params.id);
  try {
    const [results] = await pool.execute(`SELECT * FROM periods WHERE fk_section_id=?`,[stdid]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})

app.get('/attendance/:id', async (req, res) => {
  const stdid = parseInt(req.params.id);
  try {
    const [results] = await pool.execute(`SELECT student_id,name,attendance,date from student_profile INNER JOIN attendance ON student_profile.student_id=attendance.fk_student_id where student_id=?`,[stdid]);
    results.map((data) => {
      const datastring = `'${data.date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.date = formattedDate
      data.month = `${(dateObj.getMonth() + 1).toString()}`
    })
    res.json(results)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/section/:clientid', async (req, res) => {
  const clientid = req.params.clientid;
  try {
    const [results] = await pool.execute(`select * from all_classes INNER JOIN class_sections ON all_classes.class_id=class_sections.fk_class_id where all_classes.fk_client_id=?`,[clientid]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/class/:clientid', async (req, res) => {
  const clientid = req.params.clientid;
  try {
    const [results] = await pool.execute(`select * from all_classes where fk_client_id=?`,[clientid]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/api/studentlogin/:id/:phone/:pass', async (req, res) => {
  const id = req.params.id;
  const phone = req.params.phone;
  const pass = req.params.pass;
  console.log(`Student ID ${id} and phone ${phone} passed ${pass}`);
  try {
    // Use a parameterized query to prevent SQL injection
    const [results] = await pool.execute(`SELECT * FROM student_profile WHERE roll_no = ? AND mobile_no = ? AND password = ?`, [id, phone, pass]);
    if (results.length > 0) {
      // Modify the image URL (if necessary)
      results.forEach((data) => {
        data.image = `https://myschoolsystem.net/uploads/students-profile/${data.image}`;
      });
      console.log(results);

      res.json(results);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});
app.get('/showclass/:class_name/:section_name/:client', async (req, res) => {
  const cname = req.params.class_name;
  const section_name = req.params.section_name;
  const client = req.params.client
  try {
    const [results] = await pool.execute(` SELECT roll_no ,name,student_id,section_id FROM all_classes INNER JOIN class_sections ON all_classes.class_id = class_sections.fk_class_id INNER JOIN student_class ON class_sections.section_id = student_class.fk_section_id INNER JOIN student_profile ON student_class.fk_student_id = student_profile.student_id WHERE class_name =? AND section_name=? AND student_profile.fk_client_id=? `,[cname,section_name,client]);
    console.log(results);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/diary/:class_name/:section_name/:client', async (req, res) => {
  const cname = req.params.class_name;
  const section_name = req.params.section_name;
  const client = req.params.client;
  try {
    const [results] = await pool.execute(`SELECT section_id FROM class_sections WHERE fk_class_id=? AND section_name=? AND fk_client_id=?`,[cname,section_name,client]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})

app.post('/insertattendance', async (req, res) => {

  console.log(values)
  try {
    const [results] = await pool.execute(query, values);
    res.send({ message: 'Attendance inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});
app.post('/insertattendance/:id/:time/:class/:section/:client', async (req, res) => {
  const teacherid = req.params.id;
  const time = req.params.time;
  const classs = req.params.class;
  const section = req.params.section;
  const client = req.params.client;
  console.log(client);
  const des = `Teacher with <strong>ID: ${teacherid}</strong> added attendence of <strong>Class:${classs} Section:${section} </strong>`;
  const query = `INSERT INTO admin_logs (log_message,time,fk_client_id) values (?,?,?)`;
  const data=[des,time,client]
  const attendance = req.body
  const query1 = `INSERT INTO attendance (fk_student_id, attendance,date,fk_client_id) VALUES ${attendance.map(() => '(?,?,?,?)').join(', ')}`;
  const values = attendance.flatMap((attendance) => [attendance.student_id, attendance.attendance, attendance.date, attendance.fk_client_id]);
  console.log(values);
  try {
    const [results] = await pool.execute(query,data);
    const [results1] = await pool.execute(query1, values);
    res.send({ message: 'Admin Log inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});
app.post('/progress/:time/:id/:class/:section/:client', async (req, res) => {
  const data = req.body;
  const classs = req.params.class
  const section = req.params.section
  const time = req.params.time
  const school_id = req.params.id
  const client = req.params.client
  const des = `Teacher with <strong>ID: ${school_id}</strong> added Progress report of <strong>Class:${classs} Section:${section} </strong>`;
  const query1 = `INSERT INTO admin_logs (log_message,time,fk_client_id) values (?,?,?)`;
  const value=[des,time,client]
  const query = `INSERT INTO progress_report (fk_student_id, progress_grade, subject,date,fk_client_id) VALUES ${data.map(() => '(?,?,?,?,?)').join(', ')}`;
  const values = data.flatMap(item => [item.fk_student_id, item.progress_grade, item.subject, item.date, item.fk_client_id]);
  console.log(data)
  try {
    const [results] = await pool.execute(query, values);
    const [results1] = await pool.execute(query1,value);
    res.send({ message: 'Progress Report inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }

});
app.post('/every/:teacher/:time/:class/:section/:client', async (req, res) => {
  const teacher_id = req.params.teacher;
  const classs = req.params.class
  const section = req.params.section
  const time = req.params.time
  const daa = req.body;
  const client = req.params.client;
  const des = `Teacher with <strong>ID: ${teacher_id}</strong> and <strong>Client ID: ${client}</strong> added Notice for Every Student <strong>Class:${classs} Section:${section} </strong>`;
  const query1 = `INSERT INTO admin_logs (log_message,time,fk_client_id) values (?,?,?)`
const data=[des,time,client]
  const query = `INSERT INTO notices (fk_student_id, notice_description,notice_status,notice_date,fk_client_id) VALUES ${daa.map(() => '(?,?,?,?,?)').join(', ')} `;
  const values = daa.flatMap(item => [item.fk_student_id, item.notice_description, item.notice_status, item.notice_date, item.fk_client_id]);
  console.log(values)
  try {
    const [results] = await pool.execute(query, values);
    const [results1] = await pool.execute(query1,data);
    res.send({ message: 'Attendance inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});
app.post('/insertreport', async (req, res) => {
  const { attendance } = req.body;
  const query = `INSERT INTO attendance (fk_student_id, attendance,date) VALUES ${attendance.map(() => '(?,?,?)').join(', ')}`;
  const query2 = ``;
  const values = attendance.flatMap((attendance) => [attendance.student_id, attendance.attendance, attendance.date]);
  console.log(values)
  try {
    const [results] = await pool.execute(query, values);
    res.send({ message: 'Attendance inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});
app.post('/specific/:id/:name/:report/:time/:specific/:teacher/:time/:class/:section/:client', async (req, res) => {
  const fk_student_id = req.params.id;
  const notice_description = `From Teacher:${req.params.name} ${req.params.report}`
  const notice_date = req.params.time;
  const notice_status = req.params.specific;
  const teacher_id = req.params.teacher;
  const time = req.params.time
  const classs = req.params.class
  const section = req.params.section
  const client = req.params.client
  const des = `Teacher with <strong>ID: ${teacher_id}</strong> and <strong>Client ID: ${client}</strong> added Notice of Student_id ${fk_student_id}<strong>Class:${classs} Section:${section} </strong>`;
  const query1 = `INSERT INTO admin_logs (log_message,time,fk_client_id) values ('${des}','${time}','${client}')`;
  const query = `INSERT INTO notices (fk_student_id, notice_description,notice_status,notice_date,fk_client_id) VALUES (?,?,?,?,?) `;
  const data=[fk_student_id,notice_description,notice_status,notice_date,client]

  try {
    const [results] = await pool.execute(query,data);
    const [results1] = await pool.execute(query1);
    res.send({ message: 'Attendance inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});
app.post('/InsertDiary/:fk_section_id/:subject/:subject_diary/:date/:id/:class/:section/:Client/:current', async (req, res) => {
  const fk_section_id = req.params.fk_section_id;
  const subject_diary = req.params.subject_diary;
  const subject = req.params.subject;
  const date = req.params.date;
  const schoolid = req.params.id;
  const classs = req.params.class;
  const section = req.params.section;
  const cl = req.params.Client;
  const time = req.params.current;
  const des = `Teacher with <strong>ID: ${schoolid}</strong> <strong>Client ID: ${cl}</strong> added Home Work Diary of <strong>Class:${classs} Section:${section} </strong>`;
  const query = `INSERT INTO homework_diary (fk_section_id,subject,subject_diary,date,fk_client_id) VALUES (?,?,?,?,?) `;
  const data=[fk_section_id,subject,subject_diary,time,cl]
  const query1 = `INSERT INTO admin_logs (log_message,time,fk_client_id) values (?,?,?)`;

  try {
    const [results] = await pool.execute(query);
    const [results1] = await pool.execute(query1,[des,date,cl]);
    res.send({ message: 'Attendance inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});

app.get('/teacherprofile/:schoolid', async (req, res) => {
  const school_id = req.params.schoolid;
  const query = `SELECT * FROM teacher_profile where teacher_id=?`
  try {
    const [result] = await pool.execute(query,[school_id])
    result.map((data) => {
      const datastring = `'${data.dob}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.date = formattedDate
      data.image = `https://myschoolsystem.net/uploads/teachers-profile/${data.image}`
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/noticesstd/:clientid/:studentid', async (req, res) => {
  const query = `SELECT * FROM notices where fk_client_id=? and fk_student_id=? and notice_status='specific'`
  try {
    const [result] = await pool.execute(query,[req.params.clientid,req.params.studentid])
    result.map((data) => {
      const datastring = `'${data.notice_date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.notice_date = formattedDate
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/checkdiary/:subject/:date/:client/:section', async (req, res) => {
  const subject = req.params.subject;
  const date = req.params.date;
  const client = req.params.client;
  const section = req.params.section;
  const query = `SELECT * FROM homework_diary WHERE fk_client_id=? and date=? and subject=? and fk_section_id=? `
  const data=[client,data,subject,section]
  try {
    const [result] = await pool.execute(query,data)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/studentRecord/:studentid', async (req, res) => {
  const studentid=req.params.studentid;
  const query = `SELECT * FROM exam_result left join exam_title on exam_title.exam_title_id=exam_result.fk_exam_title_id left JOIN section_subjects on section_subjects.subject_id=exam_result.fk_subject_id where exam_result.fk_student_id=? `
  try {
    const [result] = await pool.execute(query,[studentid])
    console.log(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})

app.get('/classid/:classname/:client', async (req, res) => {
  const classname = req.params.classname;
  const client = req.params.client;
  const query = `SELECT * FROM all_classes where class_name=? and fk_client_id=?`
  const data=[classname,client]
  try {
    const [result] = await pool.execute(query,data)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/progress/:stdid/:subject/:client', async (req, res) => {
  const studentid = req.params.stdid;
  const subject = req.params.subject;
  const date = new Date();
  const cuurentdate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  const client = req.params.client;
  try {
    const [result] = await pool.execute(`SELECT * FROM progress_report where fk_student_id=? and fk_client_id=? and subject=? and date=?`,[studentid,client,subject,cuurentdate])
  
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/fetchnotice/:clientid', async (req, res) => {
  const student_id = req.params.student_id;
  const clientid = req.params.clientid
  const query = `SELECT notice_description,notice_date,mark_read,notice_id,fk_student_id,notice_status from notices where fk_client_id=?`
  try {
    const [result] = await pool.execute(query,[clientid])
    result.map((data) => {
      const datastring = `'${data.notice_date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.notice_date = formattedDate
    })
    result.sort((a, b) => new Date(b.notice_date) - new Date(a.notice_date));
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/fetchnotice/notice/:id/:client_ID', async (req, res) => {
  const data = req.params.id
  const client = req.params.client_ID
  const query = `SELECT notice_description,notice_date,mark_read,notice_id,fk_student_id,fk_client_id,notice_status from notices where fk_student_id=? AND fk_client_id=?`
  try {
    const [result] = await pool.execute(query,[data,client])
    result.map((data) => {
      const datastring = `'${data.notice_date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.notice_date = formattedDate

    })
    result.sort((a, b) => new Date(b.notice_date) - new Date(a.notice_date));
    console.log(result);
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/funds/:id', async (req, res) => {
  const data = req.params.id
  const query = `SELECT fund_title,fund_amount from student_funds where fk_fee_id=? `
  try {
    const [result] = await pool.execute(query,[data])
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.post('/fetchnotice/:student_id/:notice_id', async (req, res) => {
  const student_id = req.params.student_id;

  const notice_id = req.params.notice_id;
  const query = `UPDATE notices SET mark_read=1 where fk_student_id=? AND notice_id=?`
  try {
    const [result] = await pool.execute(query,[student_id,notice_id])
    result.map((data) => {
      const datastring = `'${data.notice_date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.notice_date = formattedDate
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/ProgressReport/:sectionid/:clientid/:date/:sub', async (req, res) => {
  const { date, clientid: client, sectionid: section, sub: subject } = req.params;
  const singledate = new Date(date).getDate();
  const month = new Date(date).getMonth() + 1; // Months are 0-based
  const year = new Date(date).getFullYear();

  let startDate, endDate;

  if (singledate <= 7) {
    startDate = `${year}-${month}-01`;
    endDate = `${year}-${month}-08`;
  } else if (singledate <= 14) {
    startDate = `${year}-${month}-09`;
    endDate = `${year}-${month}-15`;
  } else if (singledate <= 21) {
    startDate = `${year}-${month}-16`;
    endDate = `${year}-${month}-22`;
  } else if (singledate <= 31) {
    startDate = `${year}-${month}-23`;
    endDate = `${year}-${month}-31`;
  } else {
    return res.status(400).json({ message: 'Invalid date' });
  }

  const query = `
    SELECT 
      DISTINCT student_profile.name, student_profile.roll_no 
    FROM 
      all_classes 
    LEFT JOIN 
      class_sections ON all_classes.class_id = class_sections.fk_class_id 
    LEFT JOIN 
      student_class ON class_sections.section_id = student_class.fk_section_id 
    LEFT JOIN 
      student_profile ON student_class.fk_student_id = student_profile.student_id 
    LEFT JOIN 
      progress_report ON student_profile.student_id = progress_report.fk_student_id 
    WHERE 
      student_class.fk_section_id = ? 
      AND student_class.fk_client_id = ? 
      AND progress_report.date BETWEEN ? AND ? 
      AND progress_report.subject = ?;
  `;

  try {
    const [result] = await pool.execute(query, [section, client, startDate, endDate, subject]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.error(error);
  }
});
app.get('/Attendence/:sectionid/:clientid/:date', async (req, res) => {
  const date = req.params.date
  const client = req.params.clientid
  const section = req.params.sectionid


  const query = `SELECT * FROM all_classes LEFT JOIN class_sections ON all_classes.class_id=class_sections.fk_class_id
LEFT JOIN student_class ON class_sections.section_id=student_class.fk_section_id
LEFT JOIN student_profile ON student_class.fk_student_id=student_profile.student_id 
LEFT JOIN attendance ON student_profile.student_id=attendance.fk_student_id WHERE student_class.fk_section_id=${section} AND student_class.fk_client_id=${client} AND attendance.date='${date}' AND  attendance.fk_student_id`
  try {
    const [result] = await pool.execute(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/sectionid/:client/:classname/:sectionname', async (req, res) => {
  const classname = req.params.classname
  const client = req.params.client
  const section = req.params.sectionname
  const query = `select * from all_classes INNER JOIN class_sections ON all_classes.class_id=class_sections.fk_class_id where all_classes.fk_client_id=${client} and all_classes.class_name=${classname} and class_sections.section_name='${section}'`
  try {
    const [result] = await pool.execute(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/subjects/:section/:client', async (req, res) => {
  const section = req.params.section
  const client = req.params.client
  try {
    const [result] = await pool.execute(`select subject_name from section_subjects where fk_client_id=? and fk_section_id=?`, [client, section])
    console.log(result)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/class/:section/:client', async (req, res) => {
  const section = req.params.section
  const client = req.params.client
  try {
    const [result] = await pool.execute(`SELECT * FROM student_profile inner join student_class on student_profile.student_id=student_class.fk_student_id where student_class.fk_section_id=? and student_class.fk_client_id=?`, [ section,client])
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/Exam/:stdid', async (req, res) => {
  const stdid = req.params.stdid
  try {
    
    const [result] = await pool.execute(`select section_subjects.subject_name,exam_schedule.exam_date,exam_schedule.exam_time,exam_title.exam_title,exam_title.exam_title,exam_schedule.submission_date from exam_schedule inner join exam_title on exam_title.exam_title_id=exam_schedule.fk_exam_title_id left join section_subjects on section_subjects.subject_id=exam_schedule.fk_subject_id where exam_schedule.fk_section_id=?`, [stdid])
    result.map((data) => {
      const datastring = `'${data.exam_date}'`
      const datastring1 = `'${data.submission_date}'`
      const dateObj = new Date(datastring);
      const dateObj1 = new Date(datastring1);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      const formattedDate1 = `${dateObj1.getFullYear()}-${(dateObj1.getMonth() + 1).toString().padStart(2, '0')}-${dateObj1.getDate().toString().padStart(2, '0')}`;
      data.exam_date = formattedDate
      data.submission_date = formattedDate1
      data.month = `${(dateObj.getMonth() + 1).toString()}`
    })
    res.json(result)

  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/TeacherExam/:stdid', async (req, res) => {
  const stdid = req.params.stdid
  try {
    const [result] = await pool.execute(`select * from exam_schedule left join section_subjects on exam_schedule.fk_subject_id=section_subjects.subject_id INNER join exam_title on exam_schedule.fk_exam_title_id=exam_title.exam_title_id where exam_schedule.fk_teacher_id=?`, [stdid])
    result.map((data) => {
      const datastring = `'${data.exam_date}'`
      const datastring1 = `'${data.submission_date}'`
      const dateObj = new Date(datastring);
      const dateObj1 = new Date(datastring1);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      const formattedDate1 = `${dateObj1.getFullYear()}-${(dateObj1.getMonth() + 1).toString().padStart(2, '0')}-${dateObj1.getDate().toString().padStart(2, '0')}`;
      data.exam_date = formattedDate
      data.submission_date = formattedDate1
      data.month = `${(dateObj.getMonth() + 1).toString()}`
    })
    res.json(result)

  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/ExamName/:section/:teacher', async (req, res) => {
  const date=`${new Date().getFullYear()}-${new Date().getMonth().toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`
  console.log(date)
  const stdid = req.params.section
  const teacher = req.params.teacher
  console.log(stdid+" "+teacher)
  try {
      const [result]=await pool.execute(`SELECT DISTINCT(exam_title),exam_title_id  FROM exam_title inner join exam_schedule on exam_title.exam_title_id=exam_schedule.fk_exam_title_id inner join section_subjects on section_subjects.subject_id=exam_schedule.fk_subject_id where exam_schedule.fk_teacher_id=? and exam_schedule.fk_section_id=? and exam_schedule.submission_date>=?`,[teacher,stdid,date])
      console.log(result)
      res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/ExamSubjects/:section/:teacher/:exam', async (req, res) => {
  const stdid = req.params.section
  const teacher = req.params.teacher
  const exam = req.params.exam
  console.log(exam)
  try {
      const [result]=await pool.execute(`SELECT exam_title,exam_title_id,section_subjects.subject_name,section_subjects.subject_id FROM exam_title inner join exam_schedule on exam_title.exam_title_id=exam_schedule.fk_exam_title_id inner join section_subjects on section_subjects.subject_id=exam_schedule.fk_subject_id where exam_schedule.fk_teacher_id=? and exam_schedule.fk_section_id=? and exam_title=?`,[teacher,stdid,exam])
      console.log(result)
      res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/CheckExam/:titile/:subject/:client', async (req, res) => {
  const title = req.params.titile
  const subject = req.params.subject
  const client = req.params.client
  try {
      const [result]=await pool.execute(`SELECT * FROM exam_result where fk_exam_title_id=? and fk_subject_id=? and fk_client_id=?`,[subject,title,client])
      console.log(result)
      res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.post('/InsertMarks/:client', async (req, res) => {
  const { studentdata } = req.body;
console.log("Lenght of student data: " + studentdata.length)
  // Check if studentdata is provided and is an array
  if (!Array.isArray(studentdata) || studentdata.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty student data' });
  }

  // Prepare data for the SQL query
  const data = studentdata.map((data) => [
      data.obtained,
      data.studentID,
      data.examid,
      data.totalMarks,
      data.subject_id,
      req.params.client
  ]);
  const query1 = `INSERT INTO exam_result (obtained_marks, fk_student_id, fk_exam_title_id, total_marks, fk_subject_id, fk_client_id) VALUES (?,?,?,?,?,?)`;

  try {
    console.log(" DAta onde"+data)
   console.log(data[11])
    
    data.map(async(item)=>{
      const [result12]=await pool.execute(query1,item)
    })
      res.send("Inserted successfully")
  } catch (error) {
      console.error('Error inserting data:', error);
      res.status(500).json({ message: 'Error inserting data' });
  }
});
app.listen(500, async () => {
  console.log("Its Runing")
})
