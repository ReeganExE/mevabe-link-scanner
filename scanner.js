

void((function(list){list.map(src=>{var e=document.createElement('script');e.setAttribute('type','text/javascript');e.setAttribute('charset','UTF-8');e.setAttribute('src',src);document.head.appendChild(e)})})(['//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js?','//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.2/lodash.min.js', '//cdnjs.cloudflare.com/ajax/libs/bluebird/3.4.6/bluebird.min.js']));

document.write(`<div id="working">Working.... Just hold on</div>
                <div style="margin: 20px 2px;font-weight: bold;" >Broken:</div>
                <div id="brokens"></div>`);

setTimeout(() => {
    let $working = $('#working');
    let $brokens = $('#brokens');
    let $per = $('<label>').insertAfter($working);

    $working.text('Started Scanning...');
    $.extend({
        jhead: function(url, body) {
            return $.ajax({
                type: 'HEAD',
                url: url
            });
        }
    });


    Promise.resolve($.get('/sitemap.xml'))
        .then(a => $(a).find('loc').map((i, l) => l.textContent))
        .then(Array.from)
        .then(links => _.take(links, 200))
        .then(links => {
            let total = links.length;
            let done = 0;

            let chunks = _.chunk(links, 1000);

            return Promise.mapSeries(chunks, links => {
                let tenLinks = _.chunk(links, 10);

                return Promise.mapSeries(tenLinks, ten => {

                    // 10 requests work parallel
                    return Promise
                        .map(ten, l => Promise
                            .resolve($.jhead(l))
                            .then(a => null)
                            .catch(a => {
                                $brokens.append(`<div>${l}</div>`)
                                return l;
                            })
                            .then(l => {
                                $per.text(`${++done}/${total} ~ ${Math.ceil(done * 100 / total)}%`);
                                return l;
                            })
                        );
                })

                // After a chunk, we take a rest
                .then(rs => {
                    $working.text('Mệt quá, nghỉ tí đã').css('background', 'red');

                    return new Promise(r => {
                        setTimeout(() => {
                            r(rs);
                            $working.text('Scanning...').css('background', '');
                        }, 10000);
                    });
                });
            });
        })
        .then(links => _.flattenDepth(links, 2))
        .then(_.compact)
        .then(links => {
            let notFound = links.join('\n');
            $working.text('Done');
            $working.before(`<textarea style="margin: 0px; width: 1185px; height: 103px;">${notFound}</textarea>`);
        })
}, 2000)