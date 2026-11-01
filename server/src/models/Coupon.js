import mongoose from 'mongoose';
const schema=new mongoose.Schema({code:{type:String,unique:true,uppercase:true,trim:true},type:{type:String,enum:['percent','fixed'],required:true},value:{type:Number,min:0,required:true},minSubtotal:{type:Number,default:0},maxDiscount:{type:Number,default:0},active:{type:Boolean,default:true},expiresAt:Date,usageLimit:{type:Number,default:100},usedCount:{type:Number,default:0}},{timestamps:true});
export default mongoose.model('Coupon',schema);
