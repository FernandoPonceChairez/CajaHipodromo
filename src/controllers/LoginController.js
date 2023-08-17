const bcrypt = require('bcrypt');
const mysql = require('mysql');
const myConnection = require('express-myconnection');
const config = require('../config');

const connection = mysql.createConnection(config.database);

connection.connect((error) => {
    if (error) {
      console.error('Error connecting to the database:', error);
      return;
    }
    console.log('Connected to the database!');
  });

function login(req, res){
    if(req.session.loggedin != true){
        res.render('login/index');
    } else {
        res.redirect('/');
    }
}

function auth (req, res) {
    const { Email, Password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    connection.query(sql, [Email], (error, results) => {

    if (error) {
    console.error('Error during authentication:', error);
    res.status(500).send('An error occurred during authentication');
    return;
    }

    if (results.length === 0) {
    res.status(401).send('Invalid email or password');
    return;
    }

    const user = results[0];

    bcrypt.compare(Password, user.password)
    .then((result) => {
        if (result) {
            console.log(user.name);
            console.log(user.age);
            console.log(user.role);
            /*res.json({ message: 'Login successful'});*/
            
            req.session.loggedin =  true;
            req.session.name = user.name;
            req.session.age = user.age;
            req.session.salary = user.salary;
            console.log(user);
            req.session.Email = user.email;
            

            if(user.role=='1'){
                req.session.role1 = true;
                req.session.role2 = false;
                req.session.role3 = false;
            }else if (user.role=='2') {
                req.session.role1 = false;
                req.session.role2 = true;
                req.session.role3 = false;
            } else if(user.role=='3') {
                req.session.role1 = false;
                req.session.role2 = false;
                req.session.role3 = true;
            }
            
            res.redirect('/');
        // Include the username in the response
        } else {
            res.render('login/index',{error: 'Error: incorrect password!'});
        }
    })
    .catch((err) => {
        console.error('Error comparing passwords:', err);
        res.status(500).send('An error occurred during authentication');
    });
});
}


function register(req, res){
    if(req.session.loggedin != true){
        res.render('login/register');
    } else {
        res.redirect('/');
    }
}

function storeUser(req, res){
    const data = req.body;

    req.getConnection((err, conn)=>{
        conn.query('SELECT * FROM users WHERE email = ?',[data.Email],(err, userdata)=>{
            if(userdata.length > 0){
                res.render('login/register', {error: 'Error: user alredy exists!'});
            }else{
                console.log(data);
                bcrypt.hash(data.Password,10, (err, hash) => {
                    data.Password = hash;
                    req.getConnection((err, conn)=>{
                        conn.query('INSERT INTO users SET ?', [data], (err, rows)=>{

                            req.session.loggedin =  true;
                            req.session.Name = data.name;
                            req.session.age = data.age;
                            req.session.salary = data.salary;
                            req.session.role = data.role;
                            req.session.Email = data.Email;

                            res.redirect('/'), { name: req.session.name, age: req.session.age, salary: req.session.salary, role1: req.session.role1, role2: req.session.role2,role3: req.session.role3, Email: req.session.Email };
                        });
                    });
                });

            }
        });
    });

}

function logout(req, res){
    if(req.session.loggedin == true){
        req.session.destroy();
    } 
    res.redirect('/login');
    
}

function credito(req, res){
    if(req.session.loggedin != true){
        res.redirect('/login');
    }
    res.render('login/credito.hbs', { name: req.session.name, age: req.session.age, salary: req.session.salary, role1: req.session.role1, role2: req.session.role2,role3: req.session.role3, Email: req.session.Email });
    
}

function loanEstimate(req, res) {
    const { loanAmount, loanDuration } = req.body;
    const salary = parseFloat(req.session.salary);
    const age = parseInt(req.session.age);

    // Convert loanAmount and totalInterest to floating-point numbers
    const loanAmountFloat = parseFloat(loanAmount);
    const totalInterest = loanAmountFloat * 0.01 * loanDuration;
    const totalRepayment = loanAmountFloat + totalInterest;
    const monthlyInstallment = totalRepayment / loanDuration;
    const maxRepayment = parseFloat(salary*.4);
    const Acceptation = false;
    console.log(maxRepayment);
    console.log(monthlyInstallment);
    if((maxRepayment) >= (monthlyInstallment)){
        const Acceptation = true;
        console.log('Si entra a esta mamada');
        
        req.session.loanAmount = loanAmountFloat;
        req.session.loanDuration = loanDuration;
        req.session.interestRate = 0.01;
        req.session.interestRatePercentage = 0.01 * 100;
        req.session.totalInterest = totalInterest;
        req.session.totalRepayment = totalRepayment;
        req.session.monthlyInstallment = monthlyInstallment;

        res.render('login/loan_estimation', {
            name: req.session.name,
            Email: req.session.Email,
            age: age,
            salary: salary,
            loanAmount: loanAmountFloat,
            loanDuration: loanDuration,
            interestRate: 0.01,
            interestRatePercentage: 0.01 * 100,
            totalInterest: totalInterest,
            totalRepayment: totalRepayment,
            monthlyInstallment: monthlyInstallment,
            role1: req.session.role1,
            role2: req.session.role2,
            role3: req.session.role3,
            Email: req.session.Email 
        });
    }else{
        res.render('login/credito',{error: 'No se puede solicitar el credito'});
    }

    
}

function solicitar(req, res) {
    const data = req.body;
    const Email = req.session.Email;
    const loanAmount = req.session.loanAmount;
    const loanDuration = req.session.loanDuration;

    const s = req.session;
    const salary = parseFloat(req.session.salary);
    const age = parseInt(req.session.age);

    const loanAmountFloat = parseFloat(loanAmount);
    const totalInterest = loanAmountFloat * 0.01 * loanDuration;
    const totalRepayment = loanAmountFloat + totalInterest;
    const monthlyInstallment = totalRepayment / loanDuration;
    const maxRepayment = parseFloat(salary * 0.4);

    req.getConnection((err, conn) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return res.render('login/credito', { error: 'Error connecting to database' });
        }
        console.log(Email);
        conn.query('SELECT * FROM users WHERE email = ?', [Email], (err, userdata) => {
            console.log(s);
            console.log(loanAmountFloat);
            console.log(totalInterest);
            console.log(totalRepayment);
            console.log(monthlyInstallment);
            console.log(maxRepayment);
            console.log("*** Get data ***", req.session.data);

            if (err) {
                console.error('Error querying user data:', err);
                return res.render('login/credito', {name: req.session.name, age: req.session.age, salary: req.session.salary, role1: req.session.role1, role2: req.session.role2,role3: req.session.role3, Email: req.session.Email  ,error: 'Error querying user data' });
            }

            if (userdata.length > 0) {
                const creditData = {
                    email: Email,
                    loanDuration: loanDuration,
                    monthlyInstallment: monthlyInstallment,
                    loanAmount: loanAmountFloat,
                    interestRate: 0.01,
                    totalInterest: totalInterest
                };

                conn.query('INSERT INTO creditos SET ?', [creditData], (err, rows) => {
                    if (err) {
                        console.error('Error inserting credit data:', err);
                        return res.render('login/credito', {name: req.session.name, age: req.session.age, salary: req.session.salary, role1: req.session.role1, role2: req.session.role2,role3: req.session.role3, Email: req.session.Email  ,error: 'Error requesting credit' });
                    }

                    res.redirect('/');
                });

            } else {
                res.render('login/credito', {name: req.session.name, age: req.session.age, salary: req.session.salary, role1: req.session.role1, role2: req.session.role2,role3: req.session.role3, Email: req.session.email, error: 'Error requesting credit' });
            }


        });
    });
}

function tabla(req, res) {
    req.getConnection((err, conn) => {
      conn.query('SELECT * FROM users', (err, tasks) => {
        if(err) {
          res.json(err);
        }
        res.render('login/tabla', { tasks });
      });
    });
  }

  function tablaC(req, res) {
    req.getConnection((err, conn) => {
      conn.query('SELECT * FROM creditos', (err, tasks) => {
        if(err) {
          res.json(err);
        }
        console.log(tasks);
        res.render('login/tablaC', { tasks });
      });
    });
  }
  
  

  function store(req, res) {
    const data = req.body;
  
    req.getConnection((err, conn) => {
      conn.query('INSERT INTO users SET ?', [data], (err, rows) => {
        res.redirect('/login');
      });
    });
  }
  
  function destroy(req, res) {
    const id = req.body.id;
  
    req.getConnection((err, conn) => {
      conn.query('DELETE FROM users WHERE id = ?', [id], (err, rows) => {
        res.redirect('/login');
      });
    })
  }
  
  function edit(req, res) {
    const id = req.params.id;
  
    req.getConnection((err, conn) => {
      conn.query('SELECT * FROM users WHERE id = ?', [id], (err, tasks) => {
        if(err) {
          res.json(err);
        }
        res.render('login/edit', { tasks });
      });
    });
  }
  
  
  function update(req, res) {
    const id = req.params.id;
    const data = req.body;
  
    req.getConnection((err, conn) => {
      if (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ message: 'Database connection error' });
        return;
      }
     
      conn.query('UPDATE users SET ? WHERE id = ?', [data, id], (err, rows) => {
        if (err) {
          console.error('Update error:', err);
          res.status(500).json({ message: 'Update error' });
          return;
        }
        
        console.log('Update successful:', rows);
        res.redirect('/login');
      });
    });
  }
  
  


module.exports = {
    login,
    register,
    storeUser,
    auth,
    logout,
    credito,
    loanEstimate,
    solicitar,
    update,
    tabla,
    edit,
    destroy,
    store,
    tablaC,
}