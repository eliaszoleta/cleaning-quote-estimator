<?php
/**
 * Plugin Name:       Clean Estimator Widget
 * Plugin URI:        https://www.cleanestimator.com/for-companies
 * Description:       Embed your branded Clean Estimator cleaning cost calculator on any page or post with the [cleanestimator_widget] shortcode. Requires an active Clean Estimator subscription.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.2
 * Author:            Clean Estimator
 * Author URI:        https://www.cleanestimator.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       cleanestimator-widget
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'CLEANESTIMATOR_WIDGET_VERSION', '1.0.0' );
define( 'CLEANESTIMATOR_WIDGET_SITE_URL', 'https://www.cleanestimator.com' );

/**
 * Registers (but does not yet load) the resize-listener script. It's
 * enqueued conditionally in cleanestimator_widget_maybe_enqueue() below,
 * only on pages that actually use the shortcode.
 */
function cleanestimator_widget_register_assets() {
	wp_register_script(
		'cleanestimator-widget-embed',
		plugins_url( 'assets/embed.js', __FILE__ ),
		array(),
		CLEANESTIMATOR_WIDGET_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'cleanestimator_widget_register_assets' );

/**
 * has_shortcode() only checks the current post's own content, which
 * covers the common case (shortcode pasted into a page/post body). A
 * site embedding it via a widget or a page-builder module instead would
 * need to enqueue the script itself -- documented in readme.txt.
 */
function cleanestimator_widget_maybe_enqueue() {
	if ( is_singular() && has_shortcode( get_post()->post_content, 'cleanestimator_widget' ) ) {
		wp_enqueue_script( 'cleanestimator-widget-embed' );
	}
}
add_action( 'wp', 'cleanestimator_widget_maybe_enqueue' );

/**
 * [cleanestimator_widget company_id="..." height="700"]
 *
 * Mirrors the "Standard iFrame" embed every subscriber already sees on
 * their own dashboard (Embed Your Widget tab) -- same src pattern
 * (SITE_URL/embed?company=ID), same default height and border-radius,
 * and the resize script (assets/embed.js) listens for the exact
 * `cleancalc-resize` postMessage type the embedded page itself sends
 * (frontend/src/components/EmbedWrapper.js in the main app) -- that
 * wire-format string is a compatibility contract with the live embed
 * page, not user-facing copy, so it stays as-is even though the product
 * itself has moved on from the "CleanCalc" name.
 */
function cleanestimator_widget_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'company_id' => '',
			'height'     => '700',
		),
		$atts,
		'cleanestimator_widget'
	);

	$company_id = sanitize_text_field( $atts['company_id'] );
	if ( '' === $company_id ) {
		if ( current_user_can( 'edit_posts' ) ) {
			return '<p>' . esc_html__( 'Clean Estimator: add your company_id to this shortcode -- find your ready-made shortcode on your dashboard\'s "Embed Your Widget" tab.', 'cleanestimator-widget' ) . '</p>';
		}
		return '';
	}

	$height = absint( $atts['height'] );
	if ( $height < 300 ) {
		$height = 700;
	}

	$src = add_query_arg(
		'company',
		$company_id,
		trailingslashit( CLEANESTIMATOR_WIDGET_SITE_URL ) . 'embed'
	);

	return sprintf(
		'<iframe class="cleanestimator-widget-iframe" src="%1$s" width="100%%" height="%2$d" style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);" title="%3$s" loading="lazy"></iframe>',
		esc_url( $src ),
		$height,
		esc_attr__( 'Cleaning Cost Estimator', 'cleanestimator-widget' )
	);
}
add_shortcode( 'cleanestimator_widget', 'cleanestimator_widget_shortcode' );
