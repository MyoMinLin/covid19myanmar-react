import axios from 'axios';
import React, {useEffect, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import * as Icon from 'react-feather';
import {useTranslation} from 'react-i18next';

import {
  formatDateAbsolute,
  parseStateTimeseries,
} from '../utils/common-functions';
import {MAP_META, STATE_CODES} from '../constants';

import Clusters from './clusters';
import DeltaBarGraph from './deltabargraph';
import Level from './level';
import MapExplorer from './mapexplorer';
import Minigraph from './minigraph';
import TimeSeries from './timeseries';
import Footer from './footer';

function State(props) {
  const {t} = useTranslation();
  const mapRef = useRef();
  const tsRef = useRef();

  const {stateCode} = useParams();

  const [fetched, setFetched] = useState(false);
  const [timeseries, setTimeseries] = useState({});
  const [graphOption, setGraphOption] = useState(1);
  const [timeseriesMode, setTimeseriesMode] = useState(true);
  const [timeseriesLogMode, setTimeseriesLogMode] = useState(false);
  const [stateData, setStateData] = useState({});
  const [districtData, setDistrictData] = useState({});
  const [stateName] = useState(STATE_CODES[stateCode]);

  useEffect(() => {
    if (fetched === false) {
      getState(stateCode);
    }
  }, [fetched, stateCode]);

  const getState = async (code) => {
    try {
      const [
        {data: dataResponse},
        {data: stateDistrictWiseResponse},
        {data: statesDailyResponse},
      ] = await Promise.all([
        axios.get('https://raw.githubusercontent.com/thantthet/covid19-api/master/data.json'),
        axios.get('https://raw.githubusercontent.com/thantthet/covid19-api/master/state_district_wise.json'),
        axios.get('https://raw.githubusercontent.com/thantthet/covid19-api/master/states_daily.json'),
      ]);
      const states = dataResponse.statewise;
      setStateData(states.find((s) => s.statecode === code));
      const ts = parseStateTimeseries(statesDailyResponse)[code];
      setTimeseries(ts);
      const name = STATE_CODES[code];
      setDistrictData({
        [name]: stateDistrictWiseResponse[name],
      });
      setFetched(true);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <React.Fragment>
      <div className="State">
        <div className="state-left">
          <div className="breadcrumb fadeInUp">
            <Link to="/">Home</Link>/
            <Link to={`${stateCode}`}>{stateName}</Link>
          </div>
          <div className="header">
            <div
              className="header-left fadeInUp"
              style={{animationDelay: '0.3s'}}
            >
              <h1>{t(`statenames.${stateName.toLowerCase()}`)}</h1>
              <h5>
                {t('statepage.lastUpdatedOn', {time: Object.keys(stateData).length
                  ? formatDateAbsolute(stateData.lastupdatedtime)
                  : ''})}
              </h5>
            </div>
          </div>

          {fetched && <Level data={stateData} />}
          {fetched && <Minigraph timeseries={timeseries} />}
          {fetched && (
            <React.Fragment>
              {
                <MapExplorer
                  forwardRef={mapRef}
                  mapMeta={MAP_META[stateName]}
                  states={[stateData]}
                  stateDistrictWiseData={districtData}
                  isCountryLoaded={false}
                />
              }
            </React.Fragment>
          )}

          {fetched && (
            <div className="meta-secondary">
              <div className="unknown">
                <Icon.AlertCircle />
                <div className="unknown-right">
                  Awaiting district details for{' '}
                  {districtData[stateName]?.districtData['Unknown']
                    ?.confirmed || '0'}{' '}
                  cases
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="state-right">
          {fetched && (
            <React.Fragment>
              <div className="district-bar">
                <div
                  className="district-bar-left fadeInUp"
                  style={{animationDelay: '0.6s'}}
                >
                  <h2>{t("statepage.topDistrict")}</h2>
                  <div className="districts">
                    {districtData[stateName]
                      ? Object.keys(districtData[stateName].districtData)
                          .sort(
                            (a, b) =>
                              districtData[stateName].districtData[b]
                                .confirmed -
                              districtData[stateName].districtData[a].confirmed
                          )
                          .slice(0, 6)
                          .map((district, index) => {
                            return (
                              <div key={index} className="district">
                                <h2>
                                  {
                                    districtData[stateName].districtData[
                                      district
                                    ].confirmed
                                  }
                                </h2>
                                <h5>{district}</h5>
                                <div className="delta">
                                  <Icon.ArrowUp />
                                  <h6>
                                    {
                                      districtData[stateName].districtData[
                                        district
                                      ].delta.confirmed
                                    }
                                  </h6>
                                </div>
                              </div>
                            );
                          })
                      : ''}
                  </div>
                </div>
                <div className="district-bar-right">
                  {
                    <DeltaBarGraph
                      timeseries={timeseries.slice(-5)}
                      arrayKey={'dailyconfirmed'}
                    />
                  }
                </div>
              </div>

              <div
                className="timeseries-header fadeInUp"
                style={{animationDelay: '2.5s'}}
                ref={tsRef}
              >
                <div className="tabs">
                  <div
                    className={`tab ${graphOption === 1 ? 'focused' : ''}`}
                    onClick={() => {
                      setGraphOption(1);
                    }}
                  >
                    <h4>{t("Cumulative")}</h4>
                  </div>
                  <div
                    className={`tab ${graphOption === 2 ? 'focused' : ''}`}
                    onClick={() => {
                      setGraphOption(2);
                    }}
                  >
                    <h4>{t("Daily")}</h4>
                  </div>
                </div>

                <div className="scale-modes">
                  <label className="main">{t("Scale Modes")}</label>
                  <div className="timeseries-mode">
                    <label htmlFor="timeseries-mode">{t("chart.mode.uniform")}</label>
                    <input
                      type="checkbox"
                      checked={timeseriesMode}
                      className="switch"
                      aria-label="Checked by default to scale uniformly."
                      onChange={(event) => {
                        setTimeseriesMode(!timeseriesMode);
                      }}
                    />
                  </div>
                  <div
                    className={`timeseries-logmode ${
                      graphOption !== 1 ? 'disabled' : ''
                    }`}
                  >
                    <label htmlFor="timeseries-logmode">{t("chart.mode.logarithmic")}</label>
                    <input
                      type="checkbox"
                      checked={graphOption === 1 && timeseriesLogMode}
                      className="switch"
                      disabled={graphOption !== 1}
                      onChange={(event) => {
                        setTimeseriesLogMode(!timeseriesLogMode);
                      }}
                    />
                  </div>
                </div>
              </div>

              <TimeSeries
                timeseries={timeseries}
                type={graphOption}
                mode={timeseriesMode}
                logMode={timeseriesLogMode}
              />
            </React.Fragment>
          )}
        </div>

        <div className="state-left">
          <div className="Clusters fadeInUp" style={{animationDelay: '0.8s'}}>
            <h1>{t("Network of transmission")}</h1>
            <Clusters stateCode={stateCode} />
          </div>
        </div>

        <div className="state-right"></div>
      </div>
      <Footer />
    </React.Fragment>
  );
}

export default State;
