import { all } from 'redux-saga/effects';
import slugSaga        from './slug/slugSaga';
import menuSaga        from './menu/menuSaga';
import authSaga        from './auth/authSaga';
import reservationSaga from './reservation/reservationSaga';
import orderSaga       from './order/orderSaga';
import favouritesSaga  from './favourites/favouritesSaga';
import totalsSaga          from './totals/totalsSaga';
import cartSaga            from './cart/cartSaga';
import addressSaga         from './address/addressSaga';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function* rootSaga(): Generator<any, void, any> {
  yield all([slugSaga(), menuSaga(), authSaga(), reservationSaga(), orderSaga(), favouritesSaga(), totalsSaga(), cartSaga(), addressSaga()]);
}
