import React from 'react';
import _ from 'lodash';

import {htmlToReact, Link} from '../utils';

export default class Footer extends React.Component {
    render() {
        return (
            <footer id="colophon" className="site-footer">
              <p className="site-info">
                {htmlToReact(_.get(this.props, 'pageContext.site.siteMetadata.footer.content'))}
                &nbsp;
                {_.map(_.get(this.props, 'pageContext.site.siteMetadata.footer.links'), (link, link_idx) => (<React.Fragment key={link_idx}>
                <Link key={link_idx} to={_.get(link, 'url')} {...(_.get(link, 'new_window') ? {target: '_blank', rel: 'noopener'} : null)}>{_.get(link, 'text')}</Link>.
                </React.Fragment>))}
              </p>
              <Link id="to-top" className="to-top" to="#page"><span className="icon-arrow-up" aria-hidden="true" /><span
                  className="screen-reader-text">Back to top</span></Link>
            </footer>
        );
    }
}
