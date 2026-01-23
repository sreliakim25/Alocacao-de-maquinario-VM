const { db } = require('../config/database');

async function checkDevUser() {
    try {
        const res = await db.query("SELECT * FROM usuarios WHERE email = 'desenvolvedor@vianaemoura.com.br'");
        console.log(res.rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDevUser();
