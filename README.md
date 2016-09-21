STEPS TO USE THE APPLICATION
    1) Enter the Source Address in Latitude and Longitude like 12.9166, 77.6101
    2) Enter the Destination Address in Latitude and Longitude like 12.9345, 77.6112
    3) Enter the When u want to reach the Destination.
    4) Email-ID of the user.

STEPS FOLLOWED TO DESIGNED THE APPLICATION
    1) user has to fill the whole form
    2) Once he sets the reminder, both the Maps and Uber API are called to check if it is already time to book a cab
    3) If the answer the user is intimated by mail through PHP
    4) If no then if you are in worst time slot then check revised time after every 1 minute.
        e.g Scheduled Time : 2:00 pm, Travel Time : 60 Mins, Cab Arrival Time : 10 Mins
        So worst case the user takes (60+60 i.e maximum deviaition) + 15 i.e worst case of Uber = 135 Minutes that evaluates to 11:45 PM
        So after 11:45 PM, check every minute to minimize risk of delay
     5) If we haven't reached they worst time and then after we have reached the worst time.   
