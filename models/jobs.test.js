"use strict"

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Job = require("./jobs.js");

const{
    commonBeforeAll, commonBeforeEach,commonAfterEach, commonAfterAll, testJobIds,
} = require("./_testCommon.js");

BeforeAll(commonBeforeAll);
BeforeEach(commonBeforeEach);
aftereach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", function() {
    let newJob = {
        company_handle : "c1",
        title: "job1",
        salary: 10,
        equity: "0.1",
    };

    test("works", async function() {
        let job = await Job.create(newJob);
        expect(job).toEqual(
            {
                company_handle: "c1",
                title : "job1",
                salary : 10,
                equity : "0.1"
            }
        );
    });
});

describe("findAll", function() {
    test("works: no filter", async function() {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "j1",
                salary: 100,
                equity:"0",
                company_handle: "c1"
            },
            {
                id: testJobIds[1],
                title: "j2",
                salary: 200,
                equity:"0.1",
                company_handle: "c2"
            },
            {
                id: testJobIds[2],
                title: "j3",
                salary: 100,
                equity:"0.1",
                company_handle: "c3"
            },
        ]);
    });

    test("works: by min salary", async function () {
        let jobs = await Job.findAll({ minSalary: 150 });
        expect(jobs).toEqual(
            [{
                id: testJobIds[1],
                title: "j2",
                salary: 200,
                equity:"0.1",
                company_handle: "c2"
            }
            ]
        );
    });

    test("works: by equity", async function () {
        let jobs = await Job.findAll({ hasEquity: true });
        expect(jobs).toEqual([
          {
            id: testJobIds[1],
            title: "j2",
            salary: 200,
            equity: "0.1",
            company_handle: "c1",
          },
          {
            id: testJobIds[2],
            title: "j3",
            salary: 100,
            equity: "0.1",
            company_handle: "c3"
          },
        ]);
      });
    
      test("works: by name", async function () {
        let jobs = await Job.findAll({ title: "j1" });
        expect(jobs).toEqual([
          {
            id: testJobIds[0],
            title: "j1",
            salary: 100,
            equity: "0.1",
            company_handle: "c1",
          },
        ]);
      });
})

describe("update", function() {
    let updatedJob = {
        title: "j4",
        salary: 1000,
        equity: "0.1"
    };
    test("works", async function() {
        let job = await Job.update(testJobIds[0], updatedJob);
        expect(job).toEqual(
            {
                id: testJobIds[0],
                title: "j4",
                salary: 1000,
                equity: "0.1",
                company_handle:"c1"
            }
        );
    })

    test("no job found", async function() {
        try {
            await Job.update(9, updatedJob);
            fail();
        }
        catch(err)
        {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
})

describe("remove", function() {
    test("works", async function() {
        await Job.remove(testJobIds[0]);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=$1", [testJobIds[0]]);
        expect(res.rows.length).toEqual(0);
      });
    
      test("not found if no such job", async function () {
        try {
          await Job.remove(0);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
    });