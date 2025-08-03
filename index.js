const cors = require("cors");
const express = require("express");
const { query, VarChar } = require("msnodesqlv8");
const app = express();
exports.app = app;


const PORT = 4000;

app.use(express.json());
app.use(cors());
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

// funcion

function fillNumber(number) {
  return number < 10 ? `0${number}` : `${number}`;
}

function getToday(){
  const today =new Date();
  const year = today.getFullYear();
  const month=fillNumber(today.getMonth()+1)
  const day=fillNumber(today.getDate())
  return`${year}-${month}-${day}`
}

function getTime() {
  const now = new Date();
  const hour = now.getHours();
  const minutes = fillNumber(now.getMinutes());
  const seconds = fillNumber(now.getSeconds());
  return `${hour}:${minutes}:${seconds}`;
}


// link
app.get("/api.masterkey/get_admin",get_admin)
app.get("/api.masterkey/get-info",get_info)
app.get("/api.masterkey/waiting-unlock",waiting_unlock)
app.get("/api.masterkey/masterkey-history",masterkey_history)
app.get("/api.masterkey/get_code", get_code) 
app.get("/api.masterkey/update_code", update_code);
app.get("/api.masterkey/get_name",get_name
  
)


// arrow funcion
const Update_GetKey_Flag=async(ID)=>{
  try {
    const masterTime =getTime()
    const query=`
    USE ${Database_NewAsset}
      UPDATE ${Table_Asset}
            SET Flag = 1,
                MasterKey_Time = @masterTime
            WHERE ID = @ID
    `
    const pool =await sql.connect(config);
    await pool .request()
                .input("masterkeyTime",sql.VarChar,masterTime)
                .input("ID",sql.VarChar,ID)
                .query(query)
  } catch (error) {
    console.error(error.Message);
    
  }
  finally{
    await sql.close()
  }
}

const insertToMasterKey=async(Code)=>{
  const query=`
    USE Masterkey;
      INSERT INTO Code_Solenoid_Checker (Code_Solenoid,DATETIME)
      VALUES (@Code, @InsertDate);
    `
  const pool=await sql.connect(config)
  await pool.request()
            .input("Code",sql.VarChar,Code)
            .input("InsertDate", sql.DateTime, new Date())
            .query(query)
}


const get_admin_logic = async (Code) => {
  let result = false;
  if (!Code) return false;

  try {
    const query = `
      USE ${Database_User};
      SELECT ASSET_Approve 
      FROM ${UserRight_Control} 
      WHERE Code_Solenoid = @Code
    `;
    const pool = await sql.connect(config);
    const data = await pool.request()
      .input("Code", sql.VarChar, Code)
      .query(query);

    if (data.recordset.length > 0) {
      const value = data.recordset[0].ASSET_Approve;
      result = !!value;
    }
  } catch (error) {
    console.error("get_admin_logic error:", error.message);
    result = false;
  } finally {
    await sql.close();
  }
  return result;
};

const get_admin = async (req, res) => {
  const Code = req.query.Code?.trim();
  if (!Code) return res.status(400).json({ Result: "NG" });

  const result = await get_admin_logic(Code);
  return res.json(result);
};



const get_info = async (req, res) => {
  const Code = req.query.Code?.trim();

  if (!Code) {
    return res.status(400).json({ result: "NG", message: "No Code" });
  }

  try {
    const today = getToday();
    const isAdmin = await get_admin_logic(Code);
    await insertToMasterKey(Code)

    if (isAdmin) {
      return res.status(200).json({ Code, result: "OK", admin: true });
    }

    const pool = await sql.connect(config);
    const query = `
      USE ${Database_NewAsset};
      SELECT ID
      FROM ${Table_Asset}
      WHERE Code_Solenoid= @Code
        AND (Verifier != '' OR Verifier IS NOT NULL)
        AND returnStatus IS NULL
        AND CONVERT(date, verifyDate, 102) = @Today
        AND Flag IS NULL
      ORDER BY ID DESC;
    `;

    const data = await pool.request()
      .input("Code", sql.VarChar, Code)
      .input("Today", sql.VarChar, today)
      .query(query);

    const records = data.recordset;

    if (records.length > 0) {
      for (const record of records) {
        await Update_GetKey_Flag(record.ID);
      }

      return res.status(200).json({
        Code,
        result: "OK",
        admin: false
      });
    } else {
      return res.status(404).json({
        Code,
        result: "NG",
        admin: false
      });
    }
  } catch (error) {
    console.error("Lỗi trong get_info:", error.message);
    return res.status(500).json({
      Code,
      result: "NG",
      admin: false,
      error: error.message
    });
  } finally {
    await sql.close();
  }
};

const waiting_unlock=async(req,res)=>{
  try {
    const location=req.query?.trim()
    const pool =await sql.connect(config)
    const today=getToday()
    if(!location){
      return res.status(404).send({
        result:"NG"
      })
    }
    const query = `
          USE ${Database_NewAsset};
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
    res.status(500).send({
      result: "NG",
      data: [],
    });
  }
}

const masterkey_history=async(req,res)=>{
  try {
      const location = req.query.location?.trim();
      const pool = await sql.connect(config);
      const today = getToday();
  
      if (!location) {
        return res.status(400).send({
          result: "NG",
          data: [],
        });
      }
  
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
        data: [],
      });
    }
}

const get_code=async(req,res)=>{
  try {
    const query=`
    USE Masterkey;
      SELECT TOP 5 Code_solenoid, Code, DATETIME
      FROM Code_Solenoid_Checker
      WHERE Code = '' OR Code IS NULL
      ORDER BY ID DESC;
    `
    const pool = await sql.connect(config);
    const result=await pool.request()
                            .query(query)
    const rows = result.recordset;
    if (rows.length > 0) {
      res.status(200).json({
        result: "OK",
        code_solenoids: rows.map((row) => ({
          Code_solenoid: row.Code_solenoid,
          Code: row.Code,
          DATETIME: row.DATETIME.toLocaleString(),
        })),
      });
    } else {
      res.status(404).json({ result: "NG" });
    }
  } catch (error) {
    console.error("error query:", error.message);
    res.status(500).json({ result: "NG", error: error.message });
  }finally {
      await sql.close();
    }

}



const update_code = async (req, res) => {
  // const Code_Solenoid = req.body.code_solenoid;
  const Code_Solenoid = req.query.codeSolenoid?.trim();

  const code = req.query.code?.trim();

  if (!code) {
    return res
      .status(400)
      .json({ result: "NG" });
  }

  try {
    const query=`
    USE Masterkey;
        UPDATE Masterkey_tester
        SET Code_Solenoid = @Code_Solenoid
        WHERE Code = @code ;
    `
    const pool = await sql.connect(config);
    const updateResult=await pool.request()
                            .input("Code_Solenoid",sql.VarChar,Code_Solenoid)
                            .input("Code",sql.VarChar,Code)
                            .query(query)

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({
        result: "NG",
      });
    }

    res.status(200).json({
      result: "OK",
      updatedCode: code,
      newCodeSolenoid: Code_Solenoid,
      rowsAffected: updateResult.rowsAffected[0],
    });
  } catch (err) {
    console.error("SQL Error:", err);
    res.status(500).json({ result: "NG" });
  }
};

const get_name = async (req, res) => {
  const code = req.query.code?.trim();

  if (!code) {
    return res.status(400).json({ result: "NG", message: "No code provided." });
  }

  try {
    const query = `
      USE Masterkey;
      SELECT TOP 1 Code, FullName, Code_solenoid, Grade, Dept
      FROM Masterkey_tester
      WHERE Code = @code
      ORDER BY ID DESC;
    `;

    const pool = await sql.connect(config); 
    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(query);

    const rows = result.recordset;

    if (rows.length > 0) {
      const row = rows[0];
      const info = {
        Code_solenoid: row.Code_solenoid,
        Code: row.Code,
        FullName: row.FullName,
        Grade: row.Grade,
        Dept: row.Dept,
      };

      return res.status(200).json({ result: "OK", info });
    } else {
      return res.status(404).json({ result: "NG", message: "No data found." });
    }

  } catch (error) {
    console.error("Query error:", error.message);
    return res.status(500).json({ result: "NG", error: error.message });
  } finally {
    await sql.close();
  }
};


// listen
app.listen(PORT, () => {
  console.log(`Server conected ${PORT}`);
});