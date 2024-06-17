const date = require('date-fns')
const express = require('express')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
var {isValid} = require('date-fns')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

const app = express()
app.use(express.json())

let db = null

let dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server started at http:localhost:3000/')
    })
  } catch (e) {
    console.log(`db error ${e.message}`)
    process.exit(1)
  }
}

dbConnection()
let validateTodoProperties = (request, response, next) => {
  let {status, priority, category, date} = request.query
  let newDate = null

  // console.log(request.query)
  // console.log(status)
  // console.log(priority)
  // console.log(category)
  // console.log(date)

  // if (status === 'TO DO') {
  //   response.send('inadkfljalkfdld')
  // }
  if (
    status !== 'TO DO' &&
    status !== 'IN PROGRESS' &&
    status !== 'DONE' &&
    status !== undefined
  ) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW' &&
    priority !== undefined
  ) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (
    category !== 'WORK' &&
    category !== 'HOME' &&
    category !== 'LEARNING' &&
    category !== undefined
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else {
    let checkDate = new Date(date)
    if (isValid(checkDate)) {
      newDate = format(checkDate, 'yyyy-MM-dd')
      request.date = newDate
      next()
    } else if (date === undefined) {
      next()
    } else {
      // console.log(isValid(new Date('2021-04-01')))
      // console.log(date)
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
}
let validateTodoBody = (request, response, next) => {
  let {status, priority, category, date} = request.body
  let newDate = null

  // console.log(request.query)
  // console.log(status)
  // console.log(priority)
  // console.log(category)
  // console.log(date)

  // if (status === 'TO DO') {
  //   response.send('inadkfljalkfdld')
  // }
  if (
    status !== 'TO DO' &&
    status !== 'IN PROGRESS' &&
    status !== 'DONE' &&
    status !== undefined
  ) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW' &&
    priority !== undefined
  ) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (
    category !== 'WORK' &&
    category !== 'HOME' &&
    category !== 'LEARNING' &&
    category !== undefined
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else {
    let checkDate = new Date(date)
    if (isValid(checkDate)) {
      newDate = format(checkDate, 'yyyy-MM-dd')
      request.date = newDate
      next()
    } else if (date === undefined) {
      next()
    } else {
      // console.log(isValid(new Date('2021-04-01')))
      // console.log(date)
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
}
//   } else if (!isValid(date)) {
//     response.status(400)
//     response.send('Invalid Due Date')
//   } else {
//     newDate = format(date, 'yyyy-MM-dd')
//   }
//   request.date = date
//   next()
// }

let convertTojsonObj = obj => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  }
}

app.get('/todos/', validateTodoProperties, async (request, response) => {
  const {status, priority, search_q, category} = request.query
  let allCondQuery = ''

  if (priority !== undefined && status !== undefined) {
    allCondQuery = `SELECT * FROM todo WHERE priority = '${priority}' and status = '${status}';`
  } else if (category !== undefined && status !== undefined) {
    allCondQuery = `SELECT * FROM todo WHERE category = '${category}' and status = '${status}';`
  } else if (category !== undefined && priority !== undefined) {
    allCondQuery = `SELECT * FROM todo WHERE category = '${category}' and priority = '${priority}';`
  } else if (status !== undefined) {
    allCondQuery = `SELECT * FROM todo WHERE status = '${status}';`
  } else if (priority !== undefined) {
    allCondQuery = `SELECT * FROM todo WHERE priority = '${priority}';`
  } else if (search_q !== undefined) {
    allCondQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
  } else if (category !== undefined) {
    allCondQuery = `SELECT * FROM todo WHERE category = '${category}';`
  }

  let dbResponse = await db.all(allCondQuery)
  response.send(dbResponse.map(eachObj => convertTojsonObj(eachObj)))
})

app.get(
  '/todos/:todoId/',
  validateTodoProperties,
  async (request, response) => {
    const {todoId} = request.params
    const getOneQuery = `SELECT * FROM todo WHERE id = ${todoId}`
    let dbResponse = await db.get(getOneQuery)
    response.send(convertTojsonObj(dbResponse))
  },
)

app.get('/agenda/', validateTodoProperties, async (request, response) => {
  const date = request.date
  //console.log(date)
  const dateQuery = `SELECT * FROM todo WHERE due_date = '${date}';`
  const dbResponse = await db.all(dateQuery)
  response.send(dbResponse.map(eachObj => convertTojsonObj(eachObj)))
})

app.post(
  '/todos/',
  validateTodoProperties,
  validateTodoBody,
  async (request, response) => {
    const {id, todo, priority, status, category, dueDate} = request.body
    let checkDate = new Date(dueDate)
    if (isValid(checkDate)) {
      const postQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date) 
      VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`
      let dbResponse = await db.run(postQuery)
      response.send('Todo Successfully Added')
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  },
)

app.put(
  '/todos/:todoId/',
  validateTodoProperties,
  validateTodoBody,
  async (request, response) => {
    const {todoId} = request.params

    const {status, priority, todo, category, dueDate} = request.body
    let putQuery = ''

    if (status !== undefined) {
      putQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId}`
      await db.run(putQuery)
      response.send('Status Updated')
    } else if (priority !== undefined) {
      putQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId}`
      await db.run(putQuery)
      response.send('Priority Updated')
    } else if (todo !== undefined) {
      putQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId}`
      await db.run(putQuery)
      response.send('Todo Updated')
    } else if (category !== undefined) {
      putQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId}`
      await db.run(putQuery)
      response.send('Category Updated')
    } else if (dueDate !== undefined) {
      let checkDate = new Date(dueDate)
      if (isValid(checkDate)) {
        putQuery = `UPDATE todo SET due_date = '${dueDate}' WHERE id = ${todoId}`
        await db.run(putQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
    }
  },
)

app.delete(
  '/todos/:todoId/',
  validateTodoProperties,
  async (request, response) => {
    const {todoId} = request.params
    const deleteQuery = `DELETE FROM todo WHERE id = ${todoId}`
    await db.run(deleteQuery)
    response.send('Todo Deleted')
  },
)

module.exports = app
