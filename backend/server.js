require('dotenv').config({ path: './.env' });

const { getGeo } = require('./src/NCP/getGeo.js');
const { getDuration } = require('./src/NCP/getDuration.js');

const { Client } = require('pg');
const express = require('express');
const app = express();
const axios = require('axios');

const api_key_id = process.env.NCP_API_KEY_ID;
const api_key = process.env.NCP_API_KEY;

const QUERY_CARPOOL_LIST = `
SELECT
  name, gender, max_passenger, start_date, end_date, dotw, starting_point, start_coord, destination_point, destination_coord
FROM app_user 
	join carpool on app_user.id = carpool.driver_id
	join driver using(driver_id);
`
const options = {
  method: 'GET',
  url: 'https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving',
  headers: { Accept: 'application/json', 'X-NCP-APIGW-API-KEY-ID' : api_key_id, 'X-NCP-APIGW-API-KEY' : api_key }
}
const db_client = new Client({
  user: 'sdjin',
  host: 'localhost',
  database: 'sdjin',
  password: 'tls888',
  port: 5432,
});


async function main() {
  app.get('/list', (req, res) => { // 카풀 목록 불러오기
    let row;
    db_client.connect();
    db_client.query(QUERY_CARPOOL_LIST, (error, results) => {
      row = (error ? error.stack : results.rows) // 카풀 목록 Object
      res.json(row)
      db_client.end()
    });
  });
  app.get('/filter', (req, res) => { // 카풀 검색(필터)하기
    let start_date = req.query.start_date;
    let end_date = req.query.end_date;
    let dotw = req.query.dotw;
    let desired_time = req.query.desired_time;
    let gender = req.query.gender;
    let start, goal, ride_spot; // 좌표 문자열
    let duration;
    let row;

    // DB에서 카풀목록을 불러오고 추가적으로 소요시간을 계산하기 위해 좌표도 불러온다
    db_client.connect();
    db_client.query(QUERY_CARPOOL_LIST, (error, results) => {
      row = (error ? error.stack : results.rows)[0]
      res.json(row)
      db_client.end()
    });
    start = row['start_coord'];
    goal = row['goal_coord'];


    getGeo('미추홀구 인하로 100')
      .then(result => {
        ride_spot = result;
      });
    getDuration(start, goal, ride_spot)
      .then(result => {
        duration = result;
      });
    
    
  });

  app.listen(3000, () => console.log('user connected?'));
}

main()
