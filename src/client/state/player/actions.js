import { Packet } from '../../network/packet';
import * as types from './actionTypes';
import * as flags from './flags';
import * as worldTypes from '../world/actionTypes';

export const receiveUpdateHealth = (socket, packet) => (dispatch) => {
    const serial = packet.getInt(1);
    const maxHealth = packet.getShort(5);
    const health = packet.getShort(7);

    // ?
    // is this for self or for all mobiles?
};

// draw game player
export const receiveGamePlayer = (socket, packet) => (dispatch) => {
    packet.begin();

    const serial = packet.nextInt();
    const body = packet.nextShort();
    packet.nextByte(); // skip
    const hue = packet.nextShort();
    const flag = packet.nextByte();
    const x = packet.nextShort();
    const y = packet.nextShort();
    packet.nextShort(); // skip?
    const direction = packet.nextByte();
    const z = packet.nextByte();

    dispatch({
        type: types.PLAYER_UPDATE_SELF,
        payload: {
            serial,
            location: {
                x,
                y,
                z,
                direction
            },
            body: {
                id: body,
                hue
            }
        }
    })
};

// char location & body type
export const receiveLocationWithBody = (socket, packet) => (dispatch) => {
    packet.begin();
    const serial = packet.nextInt();
    packet.nextInt();
    const body = packet.nextShort();
    const x = packet.nextShort();
    const y = packet.nextShort();
    const z = packet.nextShort();
    const direction = packet.nextByte();

    packet.nextByte();
    packet.nextInt();

    const serverBoundX = packet.nextShort();
    const serverBoundY = packet.nextShort();
    const serverBoundWidth = packet.nextShort();
    const serverBoundHeight = packet.nextShort();

    //console.log('serial', serial);


    dispatch({
        type: worldTypes.WORLD_UPDATE_MAP,
        payload: {
            width: serverBoundWidth,
            height: serverBoundHeight,
            x: serverBoundX,
            y: serverBoundY
        }
    });
};

export const receiveWarMode = (socket, packet) => (dispatch) => {
    const warMode = packet.getByte(1) === flags.WarModeFighting;

    dispatch({
        type: types.PLAYER_UPDATE_WARMODE,
        payload: warMode
    });
};

export const sendMessage = (socket, message) => (dispatch) => {
    const size = 9 + message.length;
    const packet = new Packet(size);
    packet.append(0x03);
    packet.appendShort(size);
    packet.append(0);
    packet.appendShort(10);
    packet.appendShort(0);
    packet.append(message);
};
