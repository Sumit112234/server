require('dotenv').config();
// const Meaning = require('../models/meaning');
const {GoogleGenerativeAI} = require('@google/generative-ai');
const Meaning = require('./model/meaning');
const bodyParser = require('body-parser');
const moment = require('moment');
const express = require('express');
const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
const cors = require('cors');


const router = express.Router();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(bodyParser.json());  




async function dbConnect(){
       
    if (mongoose.connection.readyState) {
        console.log('Already connected to MongoDB');
        return true;
    }
    else{    
      
         
            mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.log('Connected to MongoDB');
                return true;
            }).catch((err) => {
                console.error('MongoDB connection error:', err);
                return false;
            });
    }

}


dbConnect();



const genAI = new GoogleGenerativeAI(process.env.GEMAI_API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let prequations = `I will write a word or words in array in english and you have to send me all the details of 
that word in following JSON format.
{
    
               
                "englishWord": "",   // my asked word (first letter should be capital)
                "noun_of_word" : "", // Noun form of my asked word (if any)
                "adjective_of_word" : "", // Adjective form of my asked word (if any)
                "word_in_differend_forms" : [], // First, second, and third form of word (if any), Example-[Do,Did,Done]
                "simple_verb_of_word : "", // my asked word in original form ( Example - played = play, Drank = Drink)
                "hindiWord": "",        // Translation of asked word in hindi
                "use_in_sentence" : "", Use of my asked word in sentence, mostly related to humans.
                "synonyms": [], // all synonyms in english
                "antonyms": [], // all antonyms in english
                "meaning" : "", // meaning of that word
                "userName": "Admin",  // default,
                "wrong_word" : false // mark true when no such asked word found or a word without meaning such as akfjdsfjh,comfentolate...

                
}

Following Rules should be followed.

 1.Return  data in this format [{...}]. 
 2.If there are multiple words in input then return output in objects of json in array.
 3.No extra data is needed excluding above json. You must neither try to talk nor try to format data, I want result in plane json without use of any /n'l' e.t.c.
 4.Follow [{...},{...},{...}] this output pattern always.
`


const getMeaning = async(word)=>{
    const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: prequations  }],
          },
         
        ],
      });
      let result = await chat.sendMessage(word);
      console.log(result.response.text());
      return result.response.text();
    //   result = await chat.sendMessage("How many paws are in my house?");
    //   console.log(result.response.text());
}


// GET  meaning
router.get('/getAll', async (req, res) => {
   if(dbConnect())
   {
    try {
        const meaning = await Meaning.find();
        res.json({error : '', status:true, meaning});
    

    } catch (error) {
        console.log(error)
        res.status(500).json({error : 'failed to fetch', status:true, meaning : []});
    }
   }
   else{
    res.status(200).json({error : 'database not connected', status:false, meaning : []})
   }
});

router.get('/getinRangeData', async (req, res) => {
   if(dbConnect())
   {
    try {
        const { startDate, endDate } = req.query;

        // Convert the dates from yyyy/mm/dd to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Adjust the end date to include the entire day
        end.setHours(23, 59, 59, 999);

        const meaning = await Meaning.find({
            date: {
                $gte: start,
                $lte: end
            }
        });

        res.json({error : '', status:true, meaning});
    } catch (error) {
        console.log(error);
        res.status(500).json({error : 'failed to fetch', status:true, meaning : []});
    }
   }
   else{
    res.status(200).json({error : 'database not connected', status:false, meaning : []})
   }

});


router.get('/',(req,res)=>{
    res.json({error : '', status:true, meaning : ['hello', 'hi', 'okay']});
})
// Get Today's Data
router.get('/getToday', async (req, res) => {
   if(dbConnect())
   {
        try {
            const startOfToday = moment().startOf('day').toDate();
            const endOfToday = moment().endOf('day').toDate();

            // console.log("startOfToday : ", startOfToday, "endOfToday : ", endOfToday);

            const meaning = await Meaning.find({
                date: {
                    $gte: startOfToday,
                    $lt: endOfToday
                }
            });

            res.json({error : '', status:true, meaning});
        } catch (error) {
            console.log(error);
            res.status(500).json({error : 'failed to fetch', status:true, meaning : []});
        } 
   }
   else{
    res.status(200).json({error : 'database not connected', status:false, meaning : []})
   }
});

// Get Yesterday's Data
router.get('/getYester', async (req, res) => {
    if(dbConnect())
    {
        try {
            const startOfYesterday = moment().subtract(1, 'days').startOf('day').toDate();
            const endOfYesterday = moment().subtract(1, 'days').endOf('day').toDate();
    
            const meaning = await Meaning.find({
                date: {
                    $gte: startOfYesterday,
                    $lt: endOfYesterday
                }
            });
    
            res.json({error : '', status:true, meaning});
        } catch (error) {
            console.log(error);
            res.status(500).json({error : 'failed to fetch', status:true, meaning : []});
        }
    }
    else{
        res.status(200).json({error : 'database not connected', status:false, meaning : []})
       }

});




// POST new meaning/s

router.post('/post', (req, res) => {

    if(dbConnect())
    {
        
             
        let err = [];

        console.log('Request Body:', req.body.text);
        // let data = {"helllo " : 1};
        // res.status(200).json({data});

        getMeaning(req?.body?.text)
        .then(async(data)=>{

            
            console.log('Raw Data:', data);
            
            data = JSON.parse(data);  // Ensure this is a valid JSON string
            console.log('Parsed Data:', data);

            if (!Array.isArray(data)) {
                throw new Error('Expected data to be an array');
            }

          
                for (const ele of data) {
                    if(!ele.wrong_word)
                    {
                        const newMeaning = new Meaning(ele);
                        try{
                            await newMeaning.save();
                        }
                        catch(e){
                            console.log("error from database : ", e);
                            err = [...err,e];
                        }
                    }                           
                }
             
            
           
            
            res.status(200).json({ data, ok: true , err});
        })
        .catch((err)=>{
            console.log("e for error : ", err);
            res.status(401).json({ err });
        })
    }
    else{
        res.status(200).json({err : 'database not connected', ok:false, data : []})
       }
   
});







app.use('/api/meanings', router);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


console.log("Shree Ram!")
