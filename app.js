const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
let userInfo;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// const date = new Date();

// if(date.getDate() === 1){
//     console.log('Es primer dia del mes');
// } else {
//     console.log(`El dia es ${date.getDate()}`);
// }
//const axios = require('axios');
//const cheerio = require('cheerio');
let dolar = 0;
const consultaDolar = require('consulta-dolar-venezuela');
consultaDolar.$monitor().then($ => { dolar = parseFloat($['$bcv'].slice(4, 9)); })

const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

const connection = require('./database/dbConnection');

app.get('/', (req, res) => {
    res.render('login')
})

app.get('/registrar', (req, res) => {
    res.render('registrar')
})

app.post('/register', (req, res) => {
    const name = req.body.name
    const lastname = req.body.lastname
    const identify = req.body.identify
    const phonenumber = req.body.phonenumber
    const email = req.body.email
    const pass = req.body.pass
    const repass = req.body.repass
    if (req.body.pass === req.body.repass) {
        connection.query(`INSERT INTO login (nombre, apellido, cedula, telefono, correo, contrasena) VALUES ('${name}','${lastname}','${identify}','${phonenumber}','${email}','${pass}')`,
            () => {
                res.render('login')
            });
    }
    else {
        //console.log(req.body);
    }
})

app.get('/inicio', (req, res) => {
    res.render('inicio')
})

app.get('/recuperar', (req, res) => {
    res.render('recuperar')
})

app.get('/mercado', (req, res) => {
    connection.query(`SELECT * FROM cuentas`, (req, results) => {
        res.render('mercado', {
            metodosPago: results,
        });
    })
})

app.get('/perfil', (req, res) => {
    res.render('perfil', {
        perfil: userInfo,
    })
})

app.post('/updateUser', (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const lastname = req.body.lastname;
    const identity = req.body.identity;
    const phone = req.body.phone;
    const email = req.body.email;
    const password = req.body.password;

    connection.query(`UPDATE login SET nombre='${name}',apellido='${lastname}',cedula='${identity}',telefono='${phone}',correo='${email}',contrasena='${password}' WHERE ID='${id}'`, (err, resuls) => {
        if (err) { console.log(err); }
        else {
            res.render('login');
        }
    })
})

app.post('/editCount',(req,res) => {
    const idCount = req.body.idCount;
    const banco = req.body.banco;
    const cedula = req.body.cedula;
    const numeroCuenta = req.body.numeroCuenta;
    const telefono = req.body.telefono;
    const correo = req.body.correo;
    connection.query(`UPDATE cuentas SET cedula='${cedula}',telefono='${telefono}',correo='${correo}',numeroCuenta='${numeroCuenta}',banco='${banco}' WHERE ID = ${idCount}`, (err, resuls) => {
        res.redirect('/mercado')
    });
})

app.post('/payClient', (req, res) => {
    const cliente = req.body.cliente;
    const cashBs = req.body.cashBs == '' ? 0 : (parseFloat(req.body.cashBs, 10)).toFixed(2);
    const cashUSD = req.body.cashUSD == '' ? 0 : (parseFloat(req.body.cashUSD, 10)).toFixed(2);
    const transBs = req.body.transBs == '' ? 0 : (parseFloat(req.body.transBs, 10)).toFixed(2);
    const phonePay = req.body.phonePay == '' ? 0 : (parseFloat(req.body.phonePay, 10)).toFixed(2);
    const transUSD = req.body.transUSD == '' ? 0 : (parseFloat(req.body.transUSD, 10)).toFixed(2);
    const debitCard = req.body.debitCard == '' ? 0 : (parseFloat(req.body.debitCard, 10)).toFixed(2);
    const creditCard = req.body.creditCard == '' ? 0 : (parseFloat(req.body.creditCard, 10)).toFixed(2);

    const pay = (
        parseFloat(cashUSD) +
        parseFloat(transUSD) +
        ((
            parseFloat(cashBs) +
            parseFloat(transBs) +
            parseFloat(phonePay) +
            parseFloat(debitCard) +
            parseFloat(creditCard)
        ) / dolar)).toFixed(2);

    connection.query(`SELECT * FROM clientes WHERE ID=${cliente}`, (res, results2) => {
        const count = (parseFloat(results2[0].cuenta)).toFixed(2);
        const pay2 = (parseFloat(results2[0].abono) + parseFloat(pay)).toFixed(2);;
        const restante = count - pay;

        if (restante >= 0) {
            connection.query(`UPDATE clientes SET abono='${pay2}', cuenta='${restante}' WHERE clientes.ID='${cliente}'`, (err, resuls) => {
                if (err) { console.log(err); }
            })
        } else {
            console.log('La cantidad a cancelar es Invalida');
        }
    })
    res.redirect('/cuentas')
})

app.get('/cuentas', (req, res) => {
    connection.query(`SELECT * FROM clientes`, (req, results) => {
        res.render('cuentas', {
            cuentas: results,
            dolar: dolar
        });
    })
})

app.get('/locales', (req, res) => {
    connection.query(`SELECT * FROM locales`, (req, results) => {
        res.render('locales', {
            locales: results,
        });
    })
})

app.get('/limpieza', (req, res) => {
    connection.query(`SELECT * FROM limpieza`, (err, results) => {
        res.render('limpieza', {
            limpieza: results,
        })
    })
})

app.get('/seguridad', (req, res) => {
    connection.query(`SELECT * FROM seguridad`, (err, results) => {
        res.render('seguridad', {
            seguridad: results,
        })
    })
})

app.get('/clientes', (req, res) => {
    Promise.all([
        new Promise((resolve, reject) => {
            connection.query(`SELECT * FROM clientes`, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }),
        new Promise((resolve, reject) => {
            connection.query(`SELECT * FROM locales WHERE ocupado = 'NO'`, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        })
    ]).then(([results1, results2]) => {
        res.render('clientes', { clientes: results1, locales: results2 });
    }).catch((error) => {
        //console.error(error);
    });
});

app.get('/editClient/:id', (req, res) => {
    const ID = req.params.id;
    connection.query(`SELECT * FROM clientes WHERE ID = '${ID}'`, (err, results) => {
        res.render('edit', { clientUpdate: results[0] });
    })
})

app.get('/editClear/:id', (req, res) => {
    const ID = req.params.id;
    connection.query(`SELECT * FROM limpieza WHERE ID = '${ID}'`, (err, results) => {
        res.render('editClear', { jobUpdate: results[0] });
    })
})

app.get('/editSecurity/:id', (req, res) => {
    const ID = req.params.id;
    connection.query(`SELECT * FROM seguridad WHERE ID = '${ID}'`, (err, results) => {
        res.render('editSecurity', { securityUpdate: results[0] });
    })
})

app.post('/editClear/updateClient', (req, res) => {
    const id = req.body.id
    const name = req.body.name
    const lastname = req.body.lastname
    const identify = req.body.identify
    const job = req.body.job
    connection.query(`UPDATE limpieza SET nombre='${name}',apellido='${lastname}',cedula='${identify}',cargo='${job}' WHERE ID='${id}'`, (err, resuls) => {
        if (err) { console.log(err); }
        else {
            res.redirect('/limpieza');
        }
    })
})

app.post('/editSecurity/updateSecurity', (req, res) => {
    const id = req.body.id
    const name = req.body.name
    const lastname = req.body.lastname
    const identify = req.body.identify
    const job = req.body.job
    connection.query(`UPDATE seguridad SET nombre='${name}',apellido='${lastname}',cedula='${identify}',cargo='${job}' WHERE ID='${id}'`, (err, resuls) => {
        if (err) { console.log(err); }
        else {
            res.redirect('/seguridad');
        }
    })
})


app.post('/editClient/updateClient', (req, res) => {
    const id = req.body.id
    const local = req.body.local
    const name = req.body.name
    const lastname = req.body.lastname
    const identify = req.body.identify
    connection.query(`UPDATE clientes SET local='${local}',nombre='${name}',apellido='${lastname}',cedula='${identify}' WHERE ID='${id}'`, (err, resuls) => {
        if (err) { console.log(err); }
        else {
            res.redirect('/clientes');
        }
    })
})


app.get('/eraserSecurity/:id', (req, res) => {
    const ID = req.params.id;
    connection.query(`DELETE FROM seguridad WHERE ID = '${ID}'`, (err, results) => {
        res.redirect('/seguridad');
    })
})

app.get('/eraserClear/:id', (req, res) => {
    const ID = req.params.id;
    connection.query(`DELETE FROM limpieza WHERE ID = '${ID}'`, (err, results) => {
        res.redirect('/limpieza');
    })
})


app.get('/eraserClient/:id', (req, res) => {
    const ID = req.params.id;
    let idLocal;
    connection.query(`SELECT * FROM clientes WHERE ID = ${ID}`, (err, res2) => {
        idLocal = res2[0].local;
        connection.query(`UPDATE locales SET ocupado='NO' WHERE ID = ${idLocal}`, (err, result) => { if (err) { console.log(err); } });
    })
    connection.query(`DELETE FROM clientes WHERE ID = '${ID}'`, (err, results) => {
        res.redirect('/clientes');
    })
})


app.post('/createClient', (req, res) => {
    const local = req.body.local
    const name = req.body.name
    const lastname = req.body.lastname
    const identify = req.body.identify
    //const count = req.body.count

    connection.query(`INSERT INTO clientes (local, nombre, apellido, cedula ) VALUES ('${local}','${name}','${lastname}','${identify}')`,
        (err, result) => {
            connection.query(`UPDATE locales SET ocupado='SI' WHERE ID = ${local}`);
            res.redirect('/clientes');
        });
})

app.post('/updateCount',(req,res) => {
    const cliente = req.body.cliente;
    const count = req.body.count;
    let oldCount = 0;

    connection.query(`SELECT cuenta FROM clientes WHERE ID = '${cliente}';`,(err, result)=>{
        oldCount = result[0].cuenta;
        oldCount += parseFloat(count);
        connection.query(`UPDATE clientes SET cuenta='${oldCount}', abono='0' WHERE ID = '${cliente}'`,(err, result)=>{
            res.redirect('/cuentas')
        })
    });
})

app.post('/createJob', (req, res) => {
    const name = req.body.name
    const lastname = req.body.lastname
    const identify = req.body.identify
    const job = req.body.job

    connection.query(`INSERT INTO limpieza (nombre, apellido, cedula, cargo) VALUES ('${name}','${lastname}','${identify}','${job}')`,
        (err, result) => {
            res.redirect('/limpieza');
        });
})

app.post('/createSec', (req, res) => {
    const name = req.body.name
    const lastname = req.body.lastname
    const identify = req.body.identify
    const job = req.body.job

    connection.query(`INSERT INTO seguridad (nombre, apellido, cedula, cargo) VALUES ('${name}','${lastname}','${identify}','${job}')`,
        (err, result) => {
            res.redirect('/seguridad');
        });
})


app.post('/recover', (req, res) => {
    const telefono = req.body.telefono;

    const pass = req.body.pass;
    const repass = req.body.repass;
    let idUser;

    connection.query(`SELECT * FROM login WHERE telefono = '${telefono}'`,
        (err, results) => {
            if (results) {
                idUser = results[0].ID;
                connection.query(`UPDATE login SET contrasena='${pass}' WHERE ID ='${idUser}'`, (err, result) => {
                    if (err) throw err;
                });
                res.render('login');
            }
            else {
                console.log(err);
            }
        })
})

app.post('/auth', (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;

    if (user && pass) {
        connection.query(`SELECT * FROM login WHERE nombre ='${user}' AND contrasena = '${pass}'`,
            (err, results) => {
                if (results.length > 0) {
                    res.render('inicio');
                    userInfo = results;
                }
                else {
                    res.render('login')
                }
            })
    }
})

app.listen(port, (res, req) => {
    console.log('Servido Conectado');
})



