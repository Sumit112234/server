const mongoose = require('mongoose');

const meaningSchema = new mongoose.Schema({
    date: {
        type: Date, 
        default: () => new Date(),
        required: true
     },
    englishWord: {
        type: String,
        required: true,
        unique : true
    },
    noun_of_word :{
        type: String,
    }, 
    
    adjective_of_word : {
        type: String,
    },
     
    word_in_differend_forms : {
        type: Array,
    } ,

   simple_verb_of_word :{
        type: String,
       
   },
    use_in_sentence:{
        type : String ,
    },
    wrong_word : {
        type:Boolean,
        default:false,
    },
    hindiWord: {
        type: String,
        required: true,
    },
    meaning: {
        type: String,
       
    },
    synonyms : [],
    antonyms : [],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },
    userName: {
        type: String,
        
    }
});

module.exports = mongoose.model('Meaning', meaningSchema);