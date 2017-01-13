# DiavgeiaStats

A web aplication showing statistics (in the form of charts) for postings on the
[Diavgeia](https://diavgeia.gov.gr/) web site. This project was my Bachelor Thesis while studying at
the IT department of [A.T.E.I. Thessaloniki](http://www.it.teithe.gr/?lang=en), and was meant to
show how data from a web application can be retrieved through an API and aggregated into meaningful
statistics.

More information on what Diavgeia is, can be found [here](https://diavgeia.gov.gr/en) (in English).

## The application

Diavgeia provides a [REST API](https://diavgeia.gov.gr/api/help) through which the data are
retrieved. The server side part of this application is written in PHP and merely handles the
connection and relays requests and results back and forth. The PHP server side code is based on (and
largely unchanged from) Diavgeia's
[OpenData API client samples](https://github.com/diavgeia/opendata-client-samples-php). The client
side is an Angular app which handles visualizing the data. The actual charts are drawn using
[Google charts](https://developers.google.com/chart/).

Obviously, this being an application I wrote while still a student, there is ample room for
improvement (which I am planning on doing when I have some free time - so basically in another
life). Most of the issues revolve around reformatting the code to make it readable, but
unfortunately the biggest one is that there is no English version yet. The basic gist of it is
simple however: enter a date range and press the big blue button to see statistics on postings per
day/category/type, and/or financial data where relevant.

A live version of the application can be found [here](http://aetos.it.teithe.gr/~nrammos/), at least
as long as the university keeps it online.
