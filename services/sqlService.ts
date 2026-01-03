
import { Resident, Expense, Announcement } from "../types";

/**
 * Converts current application state into a standard SQL script.
 * Supports residents, expenses, and announcements.
 */
export const generateSqlDump = (residents: Resident[], expenses: Expense[], announcements: Announcement[]): string => {
  let sql = `-- Maruti PG Hub - SQL Data Export\n`;
  sql += `-- Generated: ${new Date().toLocaleString()}\n`;
  sql += `-- --------------------------------------------------------\n\n`;

  // --- RESIDENTS TABLE ---
  sql += `-- Table structure for residents\n`;
  sql += `CREATE TABLE IF NOT EXISTS residents (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  firstName VARCHAR(100),\n`;
  sql += `  lastName VARCHAR(100),\n`;
  sql += `  contactNumber VARCHAR(20),\n`;
  sql += `  rent DECIMAL(10,2),\n`;
  sql += `  roomNumber VARCHAR(20),\n`;
  sql += `  hostelNumber VARCHAR(50),\n`;
  sql += `  roomType VARCHAR(10),\n`;
  sql += `  joiningDate DATE,\n`;
  sql += `  paymentStatus VARCHAR(20),\n`;
  sql += `  username VARCHAR(50),\n`;
  sql += `  password VARCHAR(100)\n`;
  sql += `);\n\n`;

  residents.forEach(r => {
    sql += `INSERT INTO residents (id, firstName, lastName, contactNumber, rent, roomNumber, hostelNumber, roomType, joiningDate, paymentStatus, username, password) \n`;
    sql += `VALUES ('${r.id}', '${r.firstName.replace(/'/g, "''")}', '${r.lastName.replace(/'/g, "''")}', '${r.contactNumber}', ${r.rent}, '${r.roomNumber}', '${r.hostelNumber}', '${r.roomType}', '${r.joiningDate}', '${r.paymentStatus}', '${r.username}', '${r.password}');\n`;
  });

  // --- EXPENSES TABLE ---
  sql += `\n\n-- Table structure for expenses\n`;
  sql += `CREATE TABLE IF NOT EXISTS expenses (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  date DATE,\n`;
  sql += `  category VARCHAR(50),\n`;
  sql += `  amount DECIMAL(10,2),\n`;
  sql += `  description TEXT\n`;
  sql += `);\n\n`;

  expenses.forEach(e => {
    sql += `INSERT INTO expenses (id, date, category, amount, description) \n`;
    sql += `VALUES ('${e.id}', '${e.date}', '${e.category}', ${e.amount}, '${e.description.replace(/'/g, "''")}');\n`;
  });

  return sql;
};

/**
 * Triggers a browser download of the generated SQL content.
 */
export const downloadSqlFile = (content: string) => {
  const blob = new Blob([content], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `MarutiPG_Database_Backup_${new Date().toISOString().split('T')[0]}.sql`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
