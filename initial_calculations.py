import pandas as pd
import numpy as np
import requests
from io import StringIO
import datetime

binned_code_dict = { 
            1: ["5.0","5.0-","5.0+"], 
            2: ["5.1","5.1-","5.1+"], 
            3: ["5.2","5.2-","5.2+"], 
            4: ["5.3","5.3-","5.3+"], 
            5: ["5.4","5.4-","5.4+"], 
            6: ["5.5","5.5-","5.5+"], 
            7: ["5.6","5.6-","5.6+"], 
            8: ["5.7","5.7-","5.7+"], 
            9: ["5.8","5.8-","5.8+"], 
            10: ["5.9","5.9-","5.9+"],
            11: ["5.10-","5.10a","5.10a/b"],
            12: ["5.10","5.10b","5.10c","5.10b/c"],
            13: ["5.10+","5.10c/d", "5.10d"],
            14: ["5.11-","5.11a","5.11a/b"],
            15: ["5.11","5.11b","5.11c","5.11b/c"],
            16: ["5.11+","5.11c/d", "5.11d"],
            17: ["5.12-","5.12a","5.12a/b"],
            18: ["5.12","5.12b","5.12c","5.12b/c"],
            19: ["5.12+","5.12c/d",  "5.12d"],
            20: ["5.13-","5.13a","5.13a/b"],
            21: ["5.13","5.13b","5.13c","5.13b/c"],
            22: ["5.13+", "5.13c/d", "5.13d"],
            23: ["5.14-","5.14a","5.14a/b"],
            24: ["5.14","5.14b","5.14c","5.14b/c"],
            25: [ "5.14+","5.14c/d", "5.14d"],
            26: ["5.15-","5.15a","5.15a/b"],
            27: ["5.15","5.15b","5.15c","5.15b/c"],
            28: ["5.15+","5.15c/d",  "5.15d"],
            101: ["V-easy"],
            102: ["V0","V0-","V0+","V0-1"],
            103: ["V1","V1-","V1+","V1-2"],
            104: ["V2","V2-","V2+","V2-3"],
            105: ["V3","V3-","V3+","V3-4"],
            106: ["V4","V4-","V4+","V4-5"],
            107: ["V5","V5-","V5+","V5-6"],
            108: ["V6","V6-","V6+","V6-7"],
            109: ["V7","V7-","V7+","V7-8"],
            110: ["V8","V8-","V8+","V8-9"],
            111: ["V9","V9-","V9+","V9-10"],
            112: ["V10","V10-","V10+","V10-11"],
            113: ["V11","V11-","V11+","V11-12"],
            114: ["V12","V12-","V12+","V12-13"],
            115: ["V13","V13-","V13+","V13-14"],
            116: ["V14","V14-","V14+","V14-15"],
            117: ["V15","V15-","V15+","V15-16"],
            118: ["V16","V16-","V16+"],
            119: ["V17","V17-","V17+"],
            120: ["V18"],
            201: ["WI1"],
            202: ["WI2"],
            203: ["WI3"],
            204: ["WI4"],
            205: ["WI5"],
            206: ["WI6"],
            207: ["WI7"],
            208: ["WI8"],
            301: ["M1"],
            302: ["M2"],
            303: ["M3"],
            304: ["M4"],
            305: ["M5"],
            306: ["M6"],
            307: ["M7"],
            308: ["M8"],
            309: ["M9"],
            310: ["M10"],
            311: ["M11"],
            312: ["M12"],
            313: ["M13"],
            314: ["M14"],
            315: ["M15"],
            316: ["M16"],
            317: ["M17"],
            318: ["M18"],
            319: ["M19"],
            401: ["A0"],
            402: ["A1"],
            403: ["A2"],
            404: ["A3"],
            405: ["A4"],
            501: ["3rd"],
            502: ["4th"],
            503: ["5th"],
            601: ["Snow"],
            701: ["C0"],
            702: ["C1"],
            703: ["C2"],
            704: ["C3"],
            705: ["C4"],
            801: ["AI0"],
            802: ["AI1"],
            803: ["AI2"],
            804: ["AI3"],
            805: ["AI4"]
            }


def perform_calculations(first_input):
    usercsvlink = first_input +"/tick-export"

    def create_df_ticklist(usercsvlink):
        #Create master data frame with correct column names
        user_df = pd.DataFrame(columns=('route_name', 'tick_date', 'route_grade', 'binned_grade', 'binned_code', 'length', 
                                        'pitches','location','lead_style', 'cur_max_rp_sport','cur_max_rp_trad',
                                        'cur_max_boulder','difficulty_category','discipline','send_bool','length_category',
                                        'season_category'))

        #download ticklist
        response = requests.get(usercsvlink, stream=False)
        data = StringIO(str(response.content, 'utf-8'))


        #Create Dataframe object from user export csv
        user_ticks = pd.read_csv(data)
        user_ticks = user_ticks.rename(columns={'Date': 'tick_date', 'Route': 'route_name', 'Rating':'route_grade', 'Your Rating':'user_grade', 
                                'Notes':'notes','URL':'route_url', 'Pitches':'pitches','Location':'location',
                                'Style':'style','Lead Style': 'lead_style','Route Type':'route_type',
                                'Length':'length', 'Rating Code':'binned_code', 'Avg Stars':'route_stars', 'Your Stars':'user_stars'})

        #get username
        url_parts = usercsvlink.split('/')
        username = url_parts[-2].replace('-', ' ')

        #Replace binned_codes
        binned_code = user_ticks['route_grade'].tolist()
        binned_code = [string if string is not None else 'unknown' for string in binned_code]
        binned_code = [str(string) for string in binned_code] 
        
        binned_code_lst = [] 
        for string in binned_code:
            string_before_space = string.split(' ')[0]
            for key, value in binned_code_dict.items():
                if any(substring == string_before_space for substring in value):
                    binned_code_lst.append(key)
                    break
            else:
                binned_code_lst.append(0)

        user_ticks['binned_code'] = binned_code_lst

        #Concat user_ticks with user_df to create final user_ticks object
        user_ticks = pd.concat([user_df, user_ticks], axis = 0, ignore_index = True)
        
        #Populate binned_grades
        user_ticks['binned_grade'] = user_ticks['binned_code'].map(lambda code: binned_code_dict.get(code, [''])[0] if code in binned_code_dict else '').tolist()


        #poplulate discipline
        conditions = [
            ((user_ticks['binned_code'] >= 0) & (user_ticks['binned_code'] < 100) & (user_ticks['route_type'] == 'Trad')),
            ((user_ticks['binned_code'] >= 0) & (user_ticks['binned_code'] < 100) & (user_ticks['route_type'] != 'Trad')),
            ((user_ticks['binned_code'] >= 100) & (user_ticks['binned_code'] < 200)),
            ((user_ticks['binned_code'] >= 200) & (user_ticks['binned_code'] < 300)),
            ((user_ticks['binned_code'] >= 300) & (user_ticks['binned_code'] < 400)),
            ((user_ticks['binned_code'] >= 400) & (user_ticks['binned_code'] < 500))
        ]
        choices = ['trad', 'sport', 'boulder', 'winter/ice', 'mixed', 'aid']

        user_ticks['discipline'] = np.select(conditions, choices, default=None)

        # populate send bool
        lead_sends = ['Redpoint', 'Flash', 'Onsight', 'Pinkpoint']
        boulder_sends = ['Send', 'Flash']

        user_ticks['send_bool'] = ((user_ticks['lead_style'].isin(lead_sends)) | (user_ticks['style'].isin(boulder_sends)))
        user_ticks['send_bool'] = user_ticks['send_bool'].fillna(False)

        #Change 0 length values to nan
        user_ticks['length'] = user_ticks['length'].replace(0, np.nan)

        #populate length_category
        length_bins = [0, 50, 80, 130, 50000]
        length_labels = ['short', 'medium', 'long', 'multipitch']

        user_ticks['length_category'] = pd.cut(user_ticks['length'], bins=length_bins, labels=length_labels, right=False)

        #Add Truncated Locations
        user_ticks['location'] = user_ticks['location'].apply(lambda x: x.split('>')).apply(lambda x: x[:3])
        user_ticks['location'] = user_ticks['location'].apply(lambda x: f"{x[-1]}, {x[0]}")

        # Populate current max sends
        user_ticks.sort_values(by='tick_date', inplace=True)
        #sport
        sport_mask = (user_ticks['discipline'] == 'sport') & (user_ticks['send_bool'] == True)
        user_ticks.loc[sport_mask, 'cur_max_rp_sport'] = user_ticks.loc[sport_mask, 'binned_code'].cummax()
        user_ticks['cur_max_rp_sport'] = user_ticks['cur_max_rp_sport'].fillna(method='ffill')

        # trad
        user_ticks['binned_code'] = pd.to_numeric(user_ticks['binned_code'], errors='coerce')
        user_ticks.sort_values(by='tick_date', inplace=True)

        trad_mask = (user_ticks['discipline'] == 'trad') & (user_ticks['send_bool'] == True)
        user_ticks.loc[trad_mask, 'cur_max_rp_trad'] = user_ticks.loc[trad_mask, 'binned_code'].cummax()
        user_ticks['cur_max_rp_trad'] = user_ticks['cur_max_rp_trad'].fillna(method='ffill')

        # boulder
        boulder_mask = (user_ticks['discipline'] == 'boulder') & (user_ticks['send_bool'] == True)
        user_ticks.loc[boulder_mask, 'cur_max_boulder'] = user_ticks.loc[boulder_mask, 'binned_code'].cummax()
        user_ticks['cur_max_boulder'] = user_ticks['cur_max_boulder'].fillna(method='ffill')

        # Replace cummax NaN with 0
        user_ticks['cur_max_rp_sport'] = user_ticks['cur_max_rp_sport'].fillna(0)
        user_ticks['cur_max_rp_trad'] = user_ticks['cur_max_rp_trad'].fillna(0)
        user_ticks['cur_max_boulder'] = user_ticks['cur_max_boulder'].fillna(0)
        
        
        #populate difficulty_category
        def difficulty_bins(discipline, binned_code, cur_max_rp_sport, cur_max_rp_trad, cur_max_boulder):
            sport_conditions = [
                (binned_code >= cur_max_rp_sport),
                (binned_code == cur_max_rp_sport - 1),
                (binned_code == cur_max_rp_sport - 2),
                (binned_code == cur_max_rp_sport - 3)
            ]

            sport_choices = [
                'Project',
                'Tier 2',
                'Tier 3',
                'Tier 4'
            ]

            trad_conditions = [
                (binned_code >= cur_max_rp_trad),
                (binned_code == cur_max_rp_trad - 1),
                (binned_code == cur_max_rp_trad - 2),
                (binned_code == cur_max_rp_trad - 3)
            ]

            trad_choices = [
                'Project',
                'Tier 2',
                'Tier 3',
                'Tier 4'
            ]

            boulder_conditions = [
                (binned_code >= cur_max_boulder),
                (binned_code == cur_max_boulder - 1),
                (binned_code == cur_max_boulder - 2),
                (binned_code == cur_max_boulder - 3)
            ]

            boulder_choices = [
                'Project',
                'Tier 2',
                'Tier 3',
                'Tier 4'
            ]

            conditions = [
                (discipline == 'sport', np.select(sport_conditions, sport_choices, default='Base Volume')),
                (discipline == 'trad', np.select(trad_conditions, trad_choices, default='Base Volume')),
                (discipline == 'boulder', np.select(boulder_conditions, boulder_choices, default='Base Volume'))
            ]

            difficulty_category = np.select([cond for cond, _ in conditions], [choice for _, choice in conditions], default='Other')
            return difficulty_category

        user_ticks['difficulty_category'] = difficulty_bins(user_ticks['discipline'], user_ticks['binned_code'], user_ticks['cur_max_rp_sport'], user_ticks['cur_max_rp_trad'], user_ticks['cur_max_boulder'])


        # Populate season category
        user_ticks['tick_date'] = pd.to_datetime(user_ticks['tick_date'])

        # Extract month and year from tick_date
        user_ticks['tick_month'] = user_ticks['tick_date'].dt.month
        user_ticks['tick_year'] = user_ticks['tick_date'].dt.year

        # Define season categories
        season_categories = {
            (3, 4, 5): 'Spring',
            (6, 7, 8): 'Summer',
            (9, 10, 11): 'Fall',
            (12, 1, 2): 'Winter'
        }

        # Map season categories based on month and year
        user_ticks['season_category'] = user_ticks[['tick_month', 'tick_year']].apply(
            lambda x: f"{season_categories.get(next((key for key in season_categories if x['tick_month'] in key), 'Unknown'))}, {x['tick_year']}",
            axis=1
        )
        #add username column
        user_ticks['username'] = username 



        #change dtypes
        user_ticks['route_name'] = user_ticks['route_name'].astype(str)
        user_ticks['route_grade'] = user_ticks['route_grade'].astype(str)
        user_ticks['pitches'] = user_ticks['pitches'].astype(int)
        user_ticks['location'] = user_ticks['location'].astype(str)
        user_ticks['lead_style'] = user_ticks['lead_style'].astype('category')
        user_ticks['length'] = user_ticks['length'].astype('Int64')
        user_ticks['binned_code'] = user_ticks['binned_code'].astype(int)
        user_ticks['cur_max_rp_sport'] = user_ticks['cur_max_rp_sport'].astype(int)
        user_ticks['cur_max_rp_trad'] = user_ticks['cur_max_rp_trad'].astype(int)
        user_ticks['cur_max_boulder'] = user_ticks['cur_max_boulder'].astype(int)
        user_ticks['length_category'] = user_ticks['length_category'].astype('category')
        user_ticks['season_category'] = user_ticks['season_category'].astype('category')
        user_ticks['difficulty_category'] = user_ticks['difficulty_category'].astype('category')
        user_ticks['discipline'] = user_ticks['discipline'].astype('category')


        pyramid_df = user_ticks.copy()


        # Remove unnecessary columns
        user_ticks.drop(['tick_month', 'tick_year','notes','route_stars','user_stars','user_grade','style', 'route_type'], axis=1, inplace=True)


                
        return user_ticks, pyramid_df, username
    
    user_ticks, pyramid_df, username = create_df_ticklist(usercsvlink)

    def pyramid1(pyramid_df):
        # Split season from year
        pyramid_df['season_category'] = pyramid_df['season_category'].str.split(",").str[0]

        # Add route characteristic column
        pyramid_df['route_characteristic'] = pd.Series(dtype='category')
        
        # Populate attempts
        def calculate_num_attempts(row):
            if row['length_category'] == 'multipitch':
                return pyramid_df.loc[pyramid_df['route_name'] == row['route_name']].shape[0]
            else:
                return pyramid_df.loc[pyramid_df['route_name'] == row['route_name'], 'pitches'].sum()

        pyramid_df['num_attempts'] = pyramid_df.apply(calculate_num_attempts, axis=1)

        # Filter to pyramids
        filtered_df = pyramid_df[pyramid_df['send_bool']]
        
        sport_df = filtered_df[filtered_df['discipline'] == 'sport']
        if not sport_df.empty:
            top_sport_binned_code = sport_df['binned_code'].max()
            top4_sport_binned_codes = list(range(top_sport_binned_code, top_sport_binned_code - 4, -1))
            sport_df = sport_df[sport_df['binned_code'].isin(top4_sport_binned_codes)]
            sport_df = sport_df.sort_values('binned_code', ascending=False)

        trad_df = filtered_df[filtered_df['discipline'] == 'trad']
        if not trad_df.empty:
            top_trad_binned_code = trad_df['binned_code'].max()
            top4_trad_binned_codes = list(range(top_trad_binned_code, top_trad_binned_code - 4, -1))
            trad_df = trad_df[trad_df['binned_code'].isin(top4_trad_binned_codes)]
            trad_df = trad_df.sort_values('binned_code', ascending=False)

        boulder_df = filtered_df[filtered_df['discipline'] == 'boulder']
        if not boulder_df.empty:
            top_boulder_binned_code = boulder_df['binned_code'].max()
            top4_boulder_binned_codes = list(range(top_boulder_binned_code, top_boulder_binned_code - 4, -1))
            boulder_df = boulder_df[boulder_df['binned_code'].isin(top4_boulder_binned_codes)]
            boulder_df = boulder_df.sort_values('binned_code', ascending=False)

        pyramid_calc = pyramid_df.copy()
        
        # Drop unneeded columns
        columns_to_drop = ['cur_max_rp_sport','send_bool','cur_max_rp_trad','cur_max_boulder','difficulty_category','tick_month', 'tick_year','notes','route_stars','user_stars','style', 'route_type']
        
        pyramid_calc.drop(columns_to_drop, axis=1, inplace=True)
        if not sport_df.empty:
            sport_df.drop(columns_to_drop, axis=1, inplace=True)
        if not trad_df.empty:
            trad_df.drop(columns_to_drop, axis=1, inplace=True)
        if not boulder_df.empty:
            boulder_df.drop(columns_to_drop, axis=1, inplace=True)

        return sport_df, trad_df, boulder_df

    sport_pyramid, trad_pyramid, boulder_pyramid = pyramid1(pyramid_df)

    return sport_pyramid, trad_pyramid, boulder_pyramid, user_ticks, username


# def perform_additional_calculations(second_input, sport_pyramid, trad_pyramid, boulder_pyramid):
#     length = len(second_input)

#     # First third
#     num_attempts = second_input[:length // 3]

#     # Second third
#     route_characteristic = second_input[length // 3: 2 * length // 3]

#     # Last third
#     route_style = second_input[2 * length // 3:]


#     # Get route_names and tick_dates from retrieved data
#     sport_route_names = [item['route_name'] for item in sport_pyramid]
#     sport_tick_dates = [item['tick_date'] for item in sport_pyramid]
#     trad_route_names = [item['route_name'] for item in trad_pyramid]
#     trad_tick_dates = [item['tick_date'] for item in trad_pyramid]
#     boulder_route_names = [item['route_name'] for item in boulder_pyramid]
#     boulder_tick_dates = [item['tick_date'] for item in boulder_pyramid]

#     sport_characteristic = route_characteristic[:len(sport_pyramid)]
#     trad_characteristic = route_characteristic[len(sport_pyramid):len(sport_pyramid) + len(trad_pyramid)]
#     boulder_characteristic = route_characteristic[len(sport_pyramid) + len(trad_pyramid):]

#     sport_attempts = num_attempts[:len(sport_pyramid)]
#     trad_attempts = num_attempts[len(sport_pyramid):len(sport_pyramid) + len(trad_pyramid)]
#     boulder_attempts = num_attempts[len(sport_pyramid) + len(trad_pyramid):]

#     sport_style = route_style[:len(sport_pyramid)]
#     trad_style = route_style[len(sport_pyramid):len(sport_pyramid) + len(trad_pyramid)]
#     boulder_style = route_style[len(sport_pyramid) + len(trad_pyramid):]


#     # Convert tick_dates to 'YYYY-MM-DD' format
#     sport_tick_dates = [date.strftime('%Y-%m-%d') for date in sport_tick_dates]
#     trad_tick_dates = [date.strftime('%Y-%m-%d') for date in trad_tick_dates]
#     boulder_tick_dates = [date.strftime('%Y-%m-%d') for date in boulder_tick_dates]


#     sport_df = pd.DataFrame({'route_name': sport_route_names,
#                              'tick_date': sport_tick_dates,
#                              'route_characteristic': sport_characteristic})

#     trad_df = pd.DataFrame({'route_name': trad_route_names,
#                             'tick_date': trad_tick_dates,
#                             'route_characteristic': trad_characteristic})

#     boulder_df = pd.DataFrame({'route_name': boulder_route_names,
#                                'tick_date': boulder_tick_dates,
#                                'route_characteristic': boulder_characteristic})

#     sport_attempts_df = pd.DataFrame({'route_name': sport_route_names,
#                                       'tick_date': sport_tick_dates,
#                                       'num_attempts': sport_attempts})

#     trad_attempts_df = pd.DataFrame({'route_name': trad_route_names,
#                                      'tick_date': trad_tick_dates,
#                                      'num_attempts': trad_attempts})

#     boulder_attempts_df = pd.DataFrame({'route_name': boulder_route_names,
#                                         'tick_date': boulder_tick_dates,
#                                         'num_attempts': boulder_attempts})
    
#     sport_style_df = pd.DataFrame({'route_name':sport_route_names,
#                                    'tick_date': sport_tick_dates,
#                                    'route_style': sport_style})
#     trad_style_df = pd.DataFrame({'route_name':trad_route_names,
#                                 'tick_date': trad_tick_dates,
#                                 'route_style': trad_style})
#     boulder_style_df = pd.DataFrame({'route_name':boulder_route_names,
#                                 'tick_date': boulder_tick_dates,
#                                 'route_style': boulder_style})

#     return sport_df, trad_df, boulder_df, sport_attempts_df, trad_attempts_df, boulder_attempts_df,sport_style_df,trad_style_df,boulder_style_df

def perform_additional_calculations(second_input, sport_pyramid, trad_pyramid, boulder_pyramid):
    length = len(second_input)
    print(second_input)
    # First third
    num_attempts = second_input[:length // 3]

    # Second third
    route_characteristic = second_input[length // 3: 2 * length // 3]

    # Last third
    route_style = second_input[2 * length // 3:]

    # Extracting IDs
    sport_ids = [item['id'] for item in sport_pyramid]
    trad_ids = [item['id'] for item in trad_pyramid]
    boulder_ids = [item['id'] for item in boulder_pyramid]

    sport_characteristic = route_characteristic[:len(sport_ids)]
    trad_characteristic = route_characteristic[len(sport_ids):len(sport_ids) + len(trad_ids)]
    boulder_characteristic = route_characteristic[len(sport_ids) + len(trad_ids):]

    sport_attempts = num_attempts[:len(sport_ids)]
    trad_attempts = num_attempts[len(sport_ids):len(sport_ids) + len(trad_ids)]
    boulder_attempts = num_attempts[len(sport_ids) + len(trad_ids):]

    sport_style = route_style[:len(sport_ids)]
    trad_style = route_style[len(sport_ids):len(sport_ids) + len(trad_ids)]
    boulder_style = route_style[len(sport_ids) + len(trad_ids):]

    # print(len(sport_route_names))
    # print(len(sport_tick_dates))
    # print(len(sport_characteristic))
    # Creating DataFrames using IDs
    sport_df = pd.DataFrame({'id': sport_ids,
                             'route_characteristic': sport_characteristic})

    trad_df = pd.DataFrame({'id': trad_ids,
                            'route_characteristic': trad_characteristic})

    boulder_df = pd.DataFrame({'id': boulder_ids,
                               'route_characteristic': boulder_characteristic})

    sport_attempts_df = pd.DataFrame({'id': sport_ids,
                                      'num_attempts': sport_attempts})

    trad_attempts_df = pd.DataFrame({'id': trad_ids,
                                     'num_attempts': trad_attempts})

    boulder_attempts_df = pd.DataFrame({'id': boulder_ids,
                                        'num_attempts': boulder_attempts})

    sport_style_df = pd.DataFrame({'id': sport_ids,
                                   'route_style': sport_style})

    trad_style_df = pd.DataFrame({'id': trad_ids,
                                  'route_style': trad_style})

    boulder_style_df = pd.DataFrame({'id': boulder_ids,
                                    'route_style': boulder_style})

    return sport_df, trad_df, boulder_df, sport_attempts_df, trad_attempts_df, boulder_attempts_df, sport_style_df, trad_style_df, boulder_style_df
