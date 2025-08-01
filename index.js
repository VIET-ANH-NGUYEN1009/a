const express = require("express");
const { query } = require("msnodesqlv8");
const app = express();
const PORT = 4000;

app.use(express.json());

const sql = require("mssql");
require("dotenv").config("./connect.env");

const config = {
  server: "192.168.173.17",
  user: "sa",
  password: "tim@2020",
  database: "NewAsset",
  options: {
    trustServerCertificate: true,
  },
};
const Table_Asset = process.env.Table_Asset;
const Table_User = process.env.Table_User;
const UserRight_Control = process.env.UserRight_Control;

const Database_NewAsset = process.env.Database_NewAsset;
const Database_User = process.env.Database_User;

app.get("/api.masterkey/get-info/:code", async (req, res) => {
  try {
    const code = req.params.code?.trim();
    const today = getToday();
    const isAdmin = await getAdmin(code);

    if (isAdmin) {
      return res.status(200).json({ code, result: "OK", admin: true });
    }

    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("Code", sql.VarChar, code)
      .input("Today", sql.VarChar, today).query(`
        USE ${Database_NewAsset};
        SELECT ID
        FROM ${Table_Asset}
        WHERE Code_Solenoid = @Code
          AND (Verifier != '' OR Verifier IS NOT NULL)
          AND returnStatus IS NULL
          AND CONVERT(date, verifyDate, 102) = @Today
          AND Flag IS NULL
        ORDER BY ID DESC;
      `);

    const records = result.recordset;

    if (records.length > 0) {
      for (const record of records) {
        await Update_GetKey_Flag(record.ID);
      }
      return res.status(200).json({
        code,
        result: "OK",
        admin: false,
        // data: records,
      });
    } else {
      return res.status(404).json({
        code,
        result: "NG",
        admin: false,
        message: "No matching records",
      });
    }
  } catch (err) {
    console.error("Query error:", err.message);
    return res.status(500).json({ code, result: "NG", error: err.message });
  } finally {
    await sql.close();
  }
});

// app.get("/api.masterkey/test/:code", async (req, res) => {
//   const code = req.params.code.trim();
//   try {
//     const pool = await sql.connect(config);
//     const today = getToday();

//     const isAdmin = await getAdmin(code);
//     if (isAdmin === "True") {
//       return res.status(500).send({ code, result: "OK" });
//     }
//     //TABLE_ASSET=Equipment_Tool_PC_LendingHistory
//     const query = `
//       USE ${Database_NewAsset}
//       SELECT ID
//       FROM ${Table_Asset}
//       WHERE Code_Solenoid = @Code
//         AND (Verifier != '' OR Verifier IS NOT NULL)
//         AND returnStatus IS NULL
//         AND CONVERT(date, verifyDate, 102) = @Today
//         AND Flag IS NULL
//       ORDER BY ID DESC
//     `;

//     const result = await pool
//       .request()
//       .input("Code", sql.VarChar, code)
//       .input("Today", sql.VarChar, today)
//       .query(query);

//     const records = result.recordset;
//     if (records.length > 0) {
//       for (const row of records) {
//         await updateFlag(row.ID);
//       }
//       return res.status(500).send({ code, result: "OK" });
//     }

//     res.status(500).send({ code, result: "NG" });
//   } catch (err) {
//     console.error("Error in get-info:", err.message);
//     res.status(500).send({ code, result: "NG" });
//   } finally {
//     await sql.close();
//   }
// });

app.get("/api.masterkey/waiting-unlock/:location", async (req, res) => {
  try {
    const location = req.params.location?.trim();
    const pool = await sql.connect(config);
    const today = getToday();

    const query = `
      USE ${Database_NewAsset}
      SELECT borrower, Borrow_Name, Dept, equipmentName, verifyDate
      FROM ${Table_Asset}
      WHERE (Verifier != '' OR Verifier IS NOT NULL)
        AND returnStatus IS NULL
        AND CONVERT(date, verifyDate, 102) = @Today
        AND Flag IS NULL
        AND Location = @Location
      ORDER BY ID DESC
    `;

    const result = await pool
      .request()
      .input("Location", sql.VarChar, location)
      .input("Today", sql.VarChar, today)
      .query(query);
    const rows = result.recordset;

    const data = rows
      .filter((r) => r.borrower?.trim() !== "")
      .map((r) => ({
        Borrower_Code: r.borrower?.trim() || "",
        Borrower_Name: r.Borrow_Name?.trim() || "",
        Dept: r.Dept?.trim() || "",
        Equip_Name: r.equipmentName?.trim() || "",
        Approval_time: r.verifyDate
          ? new Date(r.verifyDate).toISOString().split("T")[0]
          : "",
      }));

    const resultStatus = data.length > 0 ? "OK" : "NG";

    res.send({
      result: resultStatus,
      location,
      data,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      result: "NG",
      message: "Error NG",
      data: [],
    });
  }
});

app.get("/api.masterkey/masterkey-history/:location", async (req, res) => {
  try {
    const location = req.params.location?.trim();
    const pool = await sql.connect(config);
    const today = getToday();

    const query = `
      USE ${Database_NewAsset}
      SELECT borrower, Borrow_Name, Dept, equipmentName, verifyDate
      FROM ${Table_Asset}
      WHERE (Verifier != '' OR Verifier IS NOT NULL)
        AND returnStatus IS NULL
        AND CONVERT(date, verifyDate, 102) = @Today
        AND Flag IS NULL
        AND Location = @Location
      ORDER BY ID DESC
    `;

    const result = await pool
      .request()
      .input("Location", sql.VarChar, location)
      .input("Today", sql.VarChar, today)
      .query(query);

    const rows = result.recordset;

    const data = rows
      .filter((r) => r.borrower?.trim() !== "")
      .map((r) => ({
        Borrower_Code: r.borrower?.trim() || "",
        Borrower_Name: r.Borrow_Name?.trim() || "",
        Dept: r.Dept?.trim() || "",
        Equip_Name: r.equipmentName?.trim() || "",
        Approval_time: r.verifyDate
          ? new Date(r.verifyDate).toISOString().split("T")[0]
          : "",
      }));

    const resultStatus = data.length > 0 ? "OK" : "NG";

    res.send({
      result: resultStatus,
      location,
      data,
    });
  } catch (error) {
    console.error(" Error:", error);
    res.status(500).send({
      result: "NG",
      message: "Error NG",
      data: [],
    });
  }
});

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = fillNumber(today.getMonth() + 1); // Months are 0-based
  const day = fillNumber(today.getDate());
  return `${year}-${month}-${day}`;
}
function getTime() {
  const now = new Date();
  const hour = now.getHours();
  const minutes = fillNumber(now.getMinutes());
  const seconds = fillNumber(now.getSeconds());
  return `${hour}:${minutes}:${seconds}`;
}
// function getDate() {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = fillNumber(now.getMonth() + 1);
//   const day = fillNumber(now.getDate());
//   return `${year}-${month}-${day}`;
// }
// function convertNull(text) {
//   return text === null || text === undefined ? "" : text;
// }
function fillNumber(number) {
  return number < 10 ? `0${number}` : `${number}`;
}
// function fillString(str) {
//   return str.length === 1 ? `0${str}` : str;
// }

async function Update_GetKey_Flag(ID) {
  try {
    const masterTime = getTime();
    const query = `
      USE ${Database_NewAsset}
      UPDATE ${Table_Asset}
            SET Flag = 1,
                MasterKey_Time = @masterTime
            WHERE ID = @ID
    `;
    const pool = await sql.connect(config);
    await pool
      .request()
      .input("masterTime", sql.VarChar, masterTime)

      .input("ID", sql.Int, ID)
      .query(query);
  } catch (error) {
    console.error("Error updating LendingHistory:", err.message);
  } finally {
    await sql.close();
  }
}

app.put("/api.masterkey/Update_GetKey_Flag/:id", async (req, res) => {
  const ID = parseInt(req.params.id);
  try {
    await Update_GetKey_Flag(ID);
    res
      .status(500)
      .send({ status: "OK", message: `Flag updated for ID ${ID}` });
  } catch (error) {
    res.status(500).send({ status: "NG", error: error.message });
  }
});

async function getAdmin(code) {
  let result = false;
  const trimmedCode = code.trim();

  try {
    const pool = await sql.connect(config);
    const query = `
    USE ${Database_User};
      SELECT ASSET_Approve 
      FROM ${UserRight_Control} 
      WHERE Code_Solenoid = @code
    `;

    const data = await pool
      .request()
      .input("code", sql.VarChar, trimmedCode)
      .query(query);

    const rows = data.recordset;
    console.log(
      rows,
      " - ",
      rows[0],
      " - ",
      rows[0].ASSET_Approve,
      " - ",
      typeof rows[0].ASSET_Approve
    );

    if (rows.length > 0) {
      const value = rows[0].ASSET_Approve;
      result = value ? true : false;
    }
  } catch (error) {
    console.error("Error getting admin status:", error.message);
    result = false;
  } finally {
    await sql.close();
  }

  return result;
}

app.get("/api.masterkey/get_admin/:code", async (req, res) => {
  const code = req.params.code?.trim();

  try {
    const status = await getAdmin(code);

    res.status(500).send({ code, adminStatus: status });
  } catch (error) {
    console.error("Error in /admin-status:", error.message);
    res.status(500).send({ error: "Something went wrong" });
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server conected ${PORT}`);
});
