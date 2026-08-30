import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title'

// Accepts optional overrideSubtotal - used on the "Buy Now" checkout path
// so this shows the single item's total instead of the full cart's total.
const CartTotal = ({ overrideSubtotal }) => {

    const {currency,delivery_fee,getCartAmount} = useContext(ShopContext)

    const subtotal = overrideSubtotal !== undefined ? overrideSubtotal : getCartAmount()

  return (
    <div className='w-full'>
        <div className='text-2xl'>
            <Title text1={'CART'} text2={'TOTALS'} />
        </div>
        <div className='flex flex-col gap-2 mt-2 text-sm'>
            <div className='flex justify-between'>
                <p>SubTotal</p>
                <p>{currency}{subtotal}.00</p>
            </div>
            <hr />
            <div className='flex justify-between'>
                <p>Shipping Fee</p>
                <p>{currency}{subtotal===0?0:subtotal+delivery_fee}.00</p>
            </div>
            <hr />
            <div className='flex justify-between'>
                <b>Total</b>
                <b> {currency} {subtotal===0?0:subtotal+delivery_fee}.00 </b>
            </div>

        </div>

    </div>
  )
}

export default CartTotal