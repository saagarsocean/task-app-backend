const express = require('express')
const mongoose = require('mongoose')
const { checkSchema, validationResult } = require('express-validator')
const app = express()
const port = 9988

app.use(express.json())

mongoose.connect('mongodb://127.0.0.1:27017/tasks-app')
    .then(() => {
        console.log('Connected to DB')
    })
    .catch((err) => {
        console.log('Errror connected to DB')
    })

const {Schema, model} = mongoose
const taskSchema =  new Schema(
    {
        title:String,
        description:String,
        status:String
    },
    {timestamps: true}
)

const Task = model('Task', taskSchema)

const taskValidationSchema = {
    title:{
        in:['body'],
        exists:{
            errorMessage:'Title is required'
        },
        notEmpty:{
            errorMessage:'title cannot be empty'
        },
        isLength:{
            options:{min:5},
            errorMessage:'title length should be of minimum of 6 characters'
        },
        custom:{
            options: function(value) {
                return Task.findOne({title:value})
                    .then((task)=> {
                        if(task) {
                            throw new Error('title already exists')
                        } else {
                            return true
                        }
                    })
            }
        }
    },
    description:{
        in:['body'],
        exists:{
            errorMessage:'description is required'
        },
        notEmpty:{
            errorMessage:'description cannot be empty'
        }
    },
    status:{
        in:['body'],
        notEmpty:{
            errorMessage:'status cannot be empty'
        },
        isIn:{
            options:[['pending', 'in progress', 'completed']],
            errorMessage:'status should be one of (pending, in progress, completed)'
        }
    }
}

const idValidationSchema = {
    id:{
        in:['params'],
        isMongoId:{
            errorMessage: 'should be valid mongodb id'
        }
    }
}


app.post('/create-tasks', checkSchema(taskValidationSchema), (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()})
    }

    const body = req.body
    Task.create(body)
        .then((task) => {
            res.status(201).json(task)
        })
        .catch((err) => {
            res.status(500).json({error:'Internal server error'})
        })
})

app.get('/all-tasks', (req, res) => {
    Task.find()
        .then((data) => {
            res.json(data)
        })
        .catch((err) => {
            res.json(err)
        })
})

app.get('/single-task/:id', checkSchema(idValidationSchema), (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()})
    }

    const id = req.params.id
    Task.findById(id)
        .then((task) => {
            if(!task) {
                return res.status(400).json({})
            }
            res.json(task)
        })
        .catch((err) => {
            res.status(500).json({error:'Internal server error'})
        })
})

app.put('/update-task/:id', checkSchema(idValidationSchema), (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()})
    }

    const id = req.params.id
    const body = req.body
    Task.findByIdAndUpdate(id, body, {new:true})
    .then((category) => {
        if(!category) {
            return res.status(404).json({})
        }
        res.json(category)
    })
    .catch((err) => {
        res.status(500).json({error:'Internal server error'})
    })
})

app.delete('/remove-task/:id', checkSchema(idValidationSchema), (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()})
    }

    const id = req.params.id
    Task.findByIdAndDelete(id)
        .then((task) => {
            if(!task) {
                return res.status(404).json({})
            }
            res.json(task)
        })
        .catch((err) => {
            res.status(500).json({ error: 'Internal Server Error'})
        })
})

app.listen(port, () => {
    console.log('Server running on port', port)
})