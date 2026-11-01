import mongoose from 'mongoose';
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true},description:{type:String,default:''},category:{type:String,required:true},price:{type:Number,required:true,min:0},stock:{type:Number,default:0,min:0},images:[String],vendor:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},active:{type:Boolean,default:true},averageRating:{type:Number,default:0},reviewCount:{type:Number,default:0}},{timestamps:true});
export default mongoose.model('Product',schema);
