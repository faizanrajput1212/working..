const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken')
const app = express();
app.use(express.json());

const dbConfig = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
};

const pool = mysql.createPool(dbConfig);
JWT_SECRET = " dvabjhvnksdm!!!vmdfbsdvjbnsdrfnghweng"
app.get('/api/studentlogin', async (req, res) => {
  try {
    const [results] = await pool.execute('SELECT student_id, password, roll_no,mobile_no ,name FROM student_profile');
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.get('/authentication/:id', async (req, res) => {
  const std_id= req.params.id;
  const token = jwt.sign({ std_id }, JWT_SECRET);
  console.log(token)
  if (res.status(201)) {
    return res.send({ status: 'ok', mine: token })
  }
})
app.get('/api/fees/:id', async (req, res) => {
  const fk_student_id = req.params.id;
  let cal=0;
  try {
    const [results] = await pool.execute(`SELECT * FROM student_fee where fk_student_id=${fk_student_id}`);
    results.map((data)=>{
      cal=cal+data.pending_dues;
      data.totaldues=cal;
    }
    )
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});
app.get('/api/teacherlogin', async (req, res) => {
  try {
    const [results] = await pool.execute('SELECT * FROM teacher_profile');
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});
app.get('/studentprofile/:id', async (req, res) => {
  const stdid = (req.params.id);
  try {
    const [results] = await pool.execute(`SELECT * FROM all_classes INNER JOIN class_sections ON all_classes.class_id = class_sections.fk_class_id INNER JOIN student_class ON class_sections.section_id = student_class.fk_section_id INNER JOIN student_profile ON student_class.fk_student_id =student_profile.student_id WHERE student_id = ${stdid} AND status='1'`);
    results.map((data)=>
    {
      const datastring = `'${data.dob}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;
      data.dob = formattedDate
    }
    )
    console.log(results)
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/progressstudent/:id', async (req, res) => {
  const stdid = (req.params.id);
  try {
    const [results] = await pool.execute(`SELECT * FROM progress_report WHERE fk_student_id=${stdid}`);
    results.map((data)=>{
      const datastring = `'${data.date}'`
      const date = new Date(datastring);
      const day = date.getDate();
      data.date=day
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
    const [results] = await pool.execute(`SELECT * FROM timetable INNER JOIN periods ON timetable.timetable_id = periods.fk_timetable_id WHERE timetable.fk_section_id=${stdid};`);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/show/timetable/:id', async (req, res) => {
  const stdid = (req.params.id);
  try {
    const [results] = await pool.execute(`SELECT * FROM homework_diary WHERE fk_section_id=${stdid}`);
    results.map((data) => {
      const datastring = `'${data.date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.date = formattedDate;
      const formattedDate1 = `${dateObj.getDate().toString().padStart(2, '0')}`;
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
    const [results] = await pool.execute(`SELECT section_id FROM all_classes INNER JOIN class_sections ON all_classes.class_id = class_sections.fk_class_id INNER JOIN student_class ON class_sections.section_id = student_class.fk_section_id INNER JOIN student_profile ON student_class.fk_student_id =student_profile.student_id WHERE student_id = ${stdid} AND status='1'`);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/timetable/:id', async (req, res) => {
  const stdid = (req.params.id);
  try {
    const [results] = await pool.execute(`SELECT * FROM periods WHERE fk_section_id=${stdid}`);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})

app.get('/attendance/:id', async (req, res) => {
  const stdid = parseInt(req.params.id);
  try {
    const [results] = await pool.execute(`SELECT student_id,name,attendance,date from student_profile INNER JOIN attendance ON student_profile.student_id=attendance.fk_student_id where student_id=${stdid}`);
    results.map((data)=>{
      const datastring = `'${data.date}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.date = formattedDate
      data.month=`${(dateObj.getMonth() + 1).toString()}`
    })
    res.json(results)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/section', async (req, res) => {
  try {
    const [results] = await pool.execute(`select * from all_classes INNER JOIN class_sections ON all_classes.class_id=class_sections.fk_class_id`);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/class', async (req, res) => {
  try {
    const [results] = await pool.execute(`select * from all_classes `);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/api/studentlogin/:id/:pass', async (req, res) => {
  const roll_no = req.params.student_id;
  const password = req.params.pass;
  try {
    const [results] = await pool.execute(`SELECT student_id, password, roll_no FROM student_profile where email=${roll_no} AND password='${password}'`);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/showclass/:class_name/:section_name', async (req, res) => {
  const cname = req.params.class_name;
  const section_name = req.params.section_name;
  try {
    const [results] = await pool.execute(`  SELECT roll_no ,name,student_id,section_id FROM all_classes INNER JOIN class_sections ON all_classes.class_id = class_sections.fk_class_id INNER JOIN student_class ON class_sections.section_id = student_class.fk_section_id INNER JOIN student_profile ON student_class.fk_student_id = student_profile.student_id WHERE class_name =${cname} AND section_name='${section_name}' `);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
})
app.get('/diary/:class_name/:section_name', async (req, res) => {
  const cname = req.params.class_name;
  const section_name = req.params.section_name;
  try {
    const [results] = await pool.execute(`SELECT section_id FROM class_sections WHERE fk_class_id=${cname} AND section_name='${section_name}'`);
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
app.post('/insertattendance/:id/:time/:class/:section', async (req, res) => {
  const teacherid = req.params.id;
  const time = req.params.time;
  const classs = req.params.class;
  const section = req.params.section;
  const des = `Teacher with <strong>ID: ${teacherid}</strong> added attendence of <strong>Class:${classs} Section:${section} </strong>`;
  const query = `INSERT INTO admin_logs (log_message,time) values ('${des}','${time}')`;
  const attendance=req.body
  const query1 = `INSERT INTO attendance (fk_student_id, attendance,date) VALUES ${attendance.map(() => '(?,?,?)').join(', ')}`;
  const values = attendance.flatMap((attendance) => [attendance.student_id, attendance.attendance, attendance.date]);
  try {
    const [results] = await pool.execute(query);
    const [results1] = await pool.execute(query1, values);
    res.send({ message: 'Admin Log inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});
app.post('/progress/:time/:id/:class/:section', async (req, res) => {
  const data = req.body;
  const classs = req.params.class
  const section = req.params.section
  const time = req.params.time
  const school_id = req.params.id
  const des = `Teacher with <strong>ID: ${school_id}</strong> added Progress report of <strong>Class:${classs} Section:${section} </strong>`;
  const query1 = `INSERT INTO admin_logs (log_message,time) values ('${des}','${time}')`;
  const query = `INSERT INTO progress_report (fk_student_id, progress_grade, subject,date) VALUES ${data.map(() => '(?,?,?,?)').join(', ')}`;
  const values = data.flatMap(item => [item.fk_student_id, item.progress_grade, item.subject,item.date]);
  console.log(data)
  try {
    const [results] = await pool.execute(query, values);
    const [results1] = await pool.execute(query1);
    res.send({ message: 'Progress Report inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }

});
app.post('/every/:teacher/:time/:class/:section', async (req, res) => {
  const teacher_id = req.params.teacher;
  const classs = req.params.class
  const section = req.params.section
  const time = req.params.time
  const daa=req.body;
  const des = `Teacher with <strong>ID: ${teacher_id}</strong> added Notice for Every Student <strong>Class:${classs} Section:${section} </strong>`;
  const query1 = `INSERT INTO admin_logs (log_message,time) values ('${des}','${time}')`;
  
  const query = `INSERT INTO notices (fk_student_id, notice_description,notice_status,notice_date) VALUES ${daa.map(() => '(?,?,?,?)').join(', ')} `;
  const values = daa.flatMap(item => [item.fk_student_id, item.notice_description, item.notice_status,item.notice_date]);
console.log(values)
  try {
    const [results] = await pool.execute(query,values);
    const [results1] = await pool.execute(query1);
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
app.post('/specific/:id/:name/:report/:time/:specific/:teacher/:time/:class/:section', async (req, res) => {
  const fk_student_id = req.params.id;
  const notice_description = `From Teacher:${req.params.name} ${req.params.report}`
  const notice_date = req.params.time;
  const notice_status = req.params.specific;
  const teacher_id = req.params.teacher;
  const time = req.params.time
  const classs = req.params.class
  const section = req.params.section
  const des = `Teacher with <strong>ID: ${teacher_id}</strong> added Notice of Student_id ${fk_student_id}<strong>Class:${classs} Section:${section} </strong>`;
  const query1 = `INSERT INTO admin_logs (log_message,time) values ('${des}','${time}')`;
  const query = `INSERT INTO notices (fk_student_id, notice_description,notice_status,notice_date) VALUES (${fk_student_id},'${notice_description}','${notice_status}','${notice_date}') `;

  try {
    const [results] = await pool.execute(query);
    const [results1] = await pool.execute(query1);
    res.send({ message: 'Attendance inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});
app.post('/InsertDiary/:fk_section_id/:subject/:subject_diary/:date/:id/:time/:class/:section', async (req, res) => {
  const fk_section_id = req.params.fk_section_id;
  const subject_diary = req.params.subject_diary;
  const subject = req.params.subject;
  const date = req.params.date;
  const schoolid = req.params.id;
  const time = req.params.time;
  const classs = req.params.class;
  const section = req.params.section;
  const des = `Teacher with <strong>ID: ${schoolid}</strong> added Home Work Diary of <strong>Class:${classs} Section:${section} </strong>`;
  const query = `INSERT INTO homework_diary (fk_section_id,subject,subject_diary,date) VALUES (${fk_section_id},'${subject}','${subject_diary}','${date}') `;
  const query1 = `INSERT INTO admin_logs (log_message,time) values ('${des}','${time}')`;

  try {
    const [results] = await pool.execute(query);
    const [results1] = await pool.execute(query1);
    res.send({ message: 'Attendance inserted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error inserting attendance' });
  }
});

app.get('/teacherprofile/:schoolid', async (req, res) => {
  const school_id = req.params.schoolid;
  const query = `SELECT * FROM teacher_profile where teacher_id='${school_id}'`
  try {
    const [result] = await pool.execute(query)
    result.map((data)=>{
      const datastring = `'${data.dob}'`
      const dateObj = new Date(datastring);
      const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      data.date = formattedDate
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/fetchnotice/:student_id', async (req, res) => {
  const student_id = req.params.student_id;
  const query = `SELECT notice_description,notice_date,mark_read,notice_id,fk_student_id,notice_status from notices where fk_student_id=${student_id}`
  try {
    const [result] = await pool.execute(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.get('/fetchnotice/notice/:id', async (req, res) => {
 const data=req.params.id
  const query = `SELECT notice_description,notice_date,mark_read,notice_id,fk_student_id,notice_status from notices where notice_status="${data}"`
  try {
    const [result] = await pool.execute(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.post('/fetchnotice/:student_id/:notice_id', async (req, res) => {
  const student_id = req.params.student_id;
  const notice_id = req.params.notice_id;
  const query = `UPDATE notices SET mark_read=1 where fk_student_id=${student_id} AND notice_id=${notice_id}`
  try {
    const [result] = await pool.execute(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
    console.log(error)
  }
})
app.listen(3000, () => {
  console.log("ITS runing")
})
