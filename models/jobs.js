"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a Job
   * */

  static async create(data) {

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
        [
          data.title,
          data.salary,
          data.equity,
          data.company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filteringCriteria = {}) {
    let query = 
          `SELECT j.id,
                  j.title,
                  j.salary,
                  j.equity,
                  j.company_handle,
                  j.name
           FROM jobs as j
           LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let filters =[];
    let queryValues =[];
    let queryCount =0;
    const {minSalary, hasEquity, name} = filteringCriteria;
    if (minSalary != undefined)
    {
      queryValues.push(minSalary);
      queryCount++;
      filters.push(`salary >= $${queryCount}`);
    }
    if (hasEquity != undefined && hasEquity >= 0) 
    {
      queryCount++;
      filters.push(`equity > 0`);
    }
    if (name != undefined)
    {
      queryValues.push(`%${name}%`);
      queryCount++;
      filters.push(`name LIKE $${queryCount}`);
    }

    if (queryValues.length > 0)
    {
      query += " WHERE " + filters.join( " AND ") + "ORDER BY name"; 
    }
    const jobRes = await db.query(query, queryValues);
    return jobRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No jobs: ${id}`);

    return job;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle`;
    const result = await db.query(querySql, [...values, handle]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
