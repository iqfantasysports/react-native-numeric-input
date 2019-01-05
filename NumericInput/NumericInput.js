/* eslint-disable react/sort-comp */
import React, { Component } from 'react';
import _ from 'lodash';
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { create, PREDEF_RES } from 'react-native-pixel-perfect';
import Button from '../Button';

let calcSize = create(PREDEF_RES.iphone7.px);

export default class NumericInput extends Component {
    constructor(props) {
        super(props);
        
        this.increment = this.increment.bind(this);
        this.decrement = this.decrement.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onFocus = this.onFocus.bind(this);

        this.state = {
            value: props.initValue,
            lastValid: props.initValue,
            stringValue: props.initValue.toString(),
            legal: true,
        };
        this.ref = null;
    }
	
	componentWillReceiveProps(props) {
        if (props.initValue !== this.state.value) {
            this.setState({
                value: props.initValue,
                lastValid: props.initValue,
                stringValue: props.initValue.toString()
            });
        }
    }

    updateBaseResolution(width, height) {
        calcSize = create({ width, height });
    }

    increment() {
        let value = this.props.value && (typeof this.props.value === 'number') ? this.props.value : this.state.value;
        if (this.props.maxValue === null || (value < this.props.maxValue)) {
            value = (value + this.props.step).toFixed(12);
            value = this.props.valueType === 'real' ? parseFloat(value) : parseInt(value, 10);
            this.setState({ value, stringValue: value.toString() });
        }
        if (value !== this.props.value) {
            if (this.props.onChange) { 
                this.props.onChange(Number(value));
            }
        }
    }

    decrement() {
        let value = this.props.value && (typeof this.props.value === 'number') ? this.props.value : this.state.value;
        if (this.props.minValue === null || (value > this.props.minValue)) {
            value = (value - this.props.step).toFixed(12);
            value = this.props.valueType === 'real' ? parseFloat(value) : parseInt(value, 10);
            this.setState({ value, stringValue: value.toString() });
        }
        if (value !== this.props.value) {
            if (this.props.onChange) {
                this.props.onChange(Number(value));
            }
        }
    }
    
    isLegalValue(value, mReal, mInt) {
        const convertedNumber = _.toNumber(value);
        const isNaN = _.isNaN(convertedNumber);

        const result = !isNaN && 
            (((this.props.valueType === 'real' && mReal(convertedNumber)) || (this.props.valueType !== 'real' && mInt(convertedNumber))) && 
            (this.props.maxValue === null || (parseFloat(convertedNumber) <= this.props.maxValue)) && 
            (this.props.minValue === null || (parseFloat(convertedNumber) >= this.props.minValue)));
        return result;
    }

    intMatch(value) {
        return _.isInteger(value);
    }

    realMatch(value) { 
        return _.isFinite(value);
    }

    onChange(value) {
        //Immediately set the text input value to whatever the user typed in
        this.setState({ stringValue: value });

        //Accept '-' or replace '0-' with '-'
        const currValue = typeof this.props.value === 'number' ? this.props.value : this.state.value;
        if ((value.length === 1 && value === '-') || (value.length === 2 && value === '0-')) {
            this.setState({ stringValue: '-' });
            return;
        }

        const convertedNumber = _.toNumber(value);
        const parsedValue = this.props.valueType === 'real' ? parseFloat(convertedNumber) : parseInt(convertedNumber, 10);
        const legal = this.isLegalValue(value, this.intMatch, this.realMatch);

        if (!legal && !this.props.validateOnBlur) {
            if (this.ref) {
                this.ref.blur();
                setTimeout(() => {
                    this.ref.clear();
                    setTimeout(() => {
                        if (this.props.onChange) { 
                            this.props.onChange(currValue - 1);
                        }
                        this.setState({ value: currValue - 1 }, () => {
                            this.setState({ value: currValue, legal });
                            if (this.props.onChange) {
                                this.props.onChange(currValue);
                            }
                        });
                    }, 10);
                }, 15);
                setTimeout(() => this.ref.focus(), 20);
            }
        } else if (!legal && this.props.validateOnBlur) {
            this.setState({ 
                legal, 
                stringValue: value 
            });
        } else {
            const matchesType = this.props.valueType === 'real' ? true : _.isInteger(convertedNumber);

            if (this.props.onChange) { 
                this.props.onChange(parsedValue);
            }
            this.setState({ 
                value: parsedValue,
                legal,
                stringValue: matchesType ? value.toString() : parsedValue.toString()
            });
        }
    }

    onBlur() {
        const match = this.state.stringValue.match(/-?[0-9]\d*(\.\d+)?/);
        const legal = match && match[0] === match.input && ((this.props.maxValue === null || (parseFloat(this.state.stringValue) <= this.props.maxValue)) && (this.props.minValue === null || (parseFloat(this.state.stringValue) >= this.props.minValue)));

        if (!legal) {
            if (this.ref) {
                this.ref.blur();
                setTimeout(() => {
                    this.ref.clear();
                    setTimeout(() => {
                        if (this.props.onChange) { 
                            this.props.onChange(this.state.lastValid);
                        }
                        this.setState({ value: this.state.lastValid, legal: true }, () => {
                            this.setState({ 
                                legal: true,
                                value: this.state.lastValid,
                                stringValue: this.state.lastValid.toString()
                            });
                            if (this.props.onChange) { 
                                this.props.onChange(this.state.lastValid);
                            }
                        });
                    }, 10);
                }, 15);
                setTimeout(() => this.ref.focus(), 50);
            }
        }

        if (this.props.onBlur) { 
            this.props.onBlur();
        }
    }

    onFocus() {
        this.setState({ lastValid: this.state.value });
        if (this.props.onFocus) {
            this.props.onFocus();
        }
    }

    render() {
        const editable = this.props.editable;
        const separatorWidth = (typeof this.props.separatorWidth === 'undefined') ? 
            this.props.separatorWidth : 
            this.props.separatorWidth; //supporting old property name separatorWidth
        const borderColor = this.props.borderColor;
        const iconStyle = [style.icon, this.props.iconStyle];
        const totalWidth = this.props.totalWidth;
        const totalHeight = this.props.totalHeight ? this.props.totalHeight : (totalWidth * 0.4);
        const inputWidth = this.props.type === 'up-down' ? (totalWidth * 0.6) : (totalWidth * 0.4);
        const borderRadiusTotal = totalHeight * 0.18;
        const fontSize = totalHeight * 0.38;
        const textColor = this.props.textColor;
        const maxReached = this.state.value === this.props.maxValue;
        const minReached = this.state.value === this.props.minValue;
        const inputContainerStyle = this.props.type === 'up-down' ?
            [style.inputContainerUpDown, 
                { 
                    width: totalWidth, 
                    height: totalHeight, 
                    borderColor 
                }, 
                this.props.rounded ? { borderRadius: borderRadiusTotal } : {}, 
                this.props.containerStyle
            ] :
            [style.inputContainerPlusMinus, 
                { 
                    width: totalWidth, 
                    height: totalHeight, 
                    borderColor 
                }, 
                this.props.rounded ? 
                    { borderRadius: borderRadiusTotal } : {}, 
                this.props.containerStyle
            ];
        const inputStyle = this.props.type === 'up-down' ?
            [style.inputUpDown, 
                { 
                    width: inputWidth, 
                    height: totalHeight, 
                    fontSize, 
                    color: textColor, 
                    borderRightWidth: 2, 
                    borderRightColor: borderColor 
                }, 
                this.props.inputStyle] :
            [style.inputPlusMinus, 
                { 
                    width: inputWidth, 
                    height: totalHeight, 
                    fontSize, 
                    color: textColor, 
                    borderRightWidth: separatorWidth, 
                    borderLeftWidth: separatorWidth, 
                    borderLeftColor: borderColor, 
                    borderRightColor: borderColor 
                }, 
                this.props.inputStyle];
        const upDownStyle = [
            { 
                alignItems: 'center', 
                width: totalWidth - inputWidth, 
                backgroundColor: this.props.upDownButtonsBackgroundColor, 
                borderRightWidth: 1, 
                borderRightColor: borderColor 
            }, 
            this.props.rounded ? 
            { 
                borderTopRightRadius: borderRadiusTotal, 
                borderBottomRightRadius: borderRadiusTotal 
            } : {}
        ];
        const rightButtonStyle = [
            {
                position: 'absolute',
                zIndex: -1,
                right: 0,
                height: totalHeight - 2,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 0,
                backgroundColor: this.props.rightButtonBackgroundColor,
                width: (totalWidth - inputWidth) / 2
            },
            this.props.rounded ?
                {
                    borderTopRightRadius: borderRadiusTotal,
                    borderBottomRightRadius: borderRadiusTotal
                }
                : {}
        ];
        const leftButtonStyle = [
            {
                position: 'absolute',
                zIndex: -1,
                left: 0,
                height: totalHeight - 2,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: this.props.leftButtonBackgroundColor,
                width: (totalWidth - inputWidth) / 2,
                borderWidth: 0
            },
            this.props.rounded ?
                { borderTopLeftRadius: borderRadiusTotal, borderBottomLeftRadius: borderRadiusTotal }
                : {}
        ];
        const inputWrapperStyle = {
            alignSelf: 'center',
            borderLeftColor: borderColor,
            borderLeftWidth: separatorWidth,
            borderRightWidth: separatorWidth,
            borderRightColor: borderColor
        };
        const errorInputWrapperStyle = { 
            ...inputWrapperStyle, 
            ...this.props.errorInputStyle 
        };
        const keyboardType = this.props.keyboardType;

        if (this.props.type === 'up-down') {
            return (
                <View style={[...inputContainerStyle, this.state.legal !== false ? {} : this.props.errorInputStyle]}>
                    <TextInput
                        ref={ref => this.ref = ref} 
                        editable={editable} 
                        returnKeyType='done' 
                        underlineColorAndroid='rgba(0,0,0,0)' 
                        keyboardType={keyboardType} 
                        value={this.state.stringValue} 
                        onChangeText={this.onChange} 
                        style={inputStyle}  
                        onBlur={this.onBlur} 
                        onFocus={this.onFocus}
                    />
                    <View style={upDownStyle}>
                        <Button onPress={this.increment} style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                            <Icon 
                                name='ios-arrow-up' 
                                size={fontSize} 
                                style={
                                    [
                                    ...iconStyle, 
                                    maxReached ? this.props.reachMaxIncIconStyle : {}, 
                                    minReached ? this.props.reachMinIncIconStyle : {}
                                    ]
                                } 
                            />
                        </Button>
                        <Button 
                            onPress={this.decrement} 
                            style={{ flex: 1, width: '100%', alignItems: 'center' }}
                        >
                            <Icon 
                                name='ios-arrow-down' 
                                size={fontSize} 
                                style={
                                    [
                                        ...iconStyle,
                                        maxReached ? this.props.reachMaxDecIconStyle : {},
                                        minReached ? this.props.reachMinDecIconStyle : {}
                                    ]
                                } 
                            />
                        </Button>
                    </View>
                </View>);
        }
        
        return (
            <View style={inputContainerStyle}>
                <Button onPress={this.decrement} style={leftButtonStyle}>
                    <Icon 
                        name='md-remove' 
                        size={fontSize} 
                        style={
                            [
                                ...iconStyle, 
                                maxReached ? this.props.reachMaxDecIconStyle : {},
                                minReached ? this.props.reachMinDecIconStyle : {}
                            ]
                        } 
                    />
                </Button>
                <View style={this.state.legal !== false ? inputWrapperStyle : errorInputWrapperStyle}>
                    <TextInput
                        ref={ref => this.ref = ref}
                        editable={editable} 
                        returnKeyType='done' 
                        underlineColorAndroid='rgba(0,0,0,0)' 
                        keyboardType={keyboardType} 
                        value={this.state.stringValue} 
                        onChangeText={this.onChange} 
                        style={inputStyle}   
                        onBlur={this.onBlur} onFocus={this.onFocus} 
                    />
                </View>
                <Button onPress={this.increment} style={rightButtonStyle}>
                    <Icon 
                        name='md-add' 
                        size={fontSize} 
                        style={
                            [
                                ...iconStyle, 
                                maxReached ? this.props.reachMaxIncIconStyle : {},
                                minReached ? this.props.reachMinIncIconStyle : {}
                            ]
                        } 
                    />
                </Button>
            </View>
        );
    }
}

const style = StyleSheet.create({
    separator: {
        backgroundColor: 'grey',
        height: calcSize(80),
    },
    inputContainerUpDown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        borderColor: 'grey',
        borderWidth: 1
    },
    inputContainerPlusMinus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1
    },
    inputUpDown: {
        textAlign: 'center',
        padding: 0

    },
    inputPlusMinus: {
        textAlign: 'center',
        padding: 0
    },
    icon: {
        fontWeight: '900',
        backgroundColor: 'rgba(0,0,0,0)'
    },
    upDown: {
        alignItems: 'center',
        paddingRight: calcSize(15)
    }
});

NumericInput.propTypes = {
    iconSize: PropTypes.number,
    borderColor: PropTypes.string,
    iconStyle: PropTypes.any,
    totalWidth: PropTypes.number,
    totalHeight: PropTypes.number,
    separatorWidth: PropTypes.number,
    type: PropTypes.oneOf(['up-down', 'plus-minus']),
    valueType: PropTypes.oneOf(['real', 'integer']),
    rounded: PropTypes.any,
    textColor: PropTypes.string,
    containerStyle: PropTypes.any,
    inputStyle: PropTypes.any,
    errorInputStyle: PropTypes.any,
    initValue: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.number,
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    step: PropTypes.number,
    upDownButtonsBackgroundColor: PropTypes.string,
    rightButtonBackgroundColor: PropTypes.string,
    leftButtonBackgroundColor: PropTypes.string,
    editable: PropTypes.bool,
    reachMaxIncIconStyle: PropTypes.any,
    reachMaxDecIconStyle: PropTypes.any,
    reachMinIncIconStyle: PropTypes.any,
    reachMinDecIconStyle: PropTypes.any,
    keyboardType: PropTypes.string,
};

NumericInput.defaultProps = {
    iconSize: calcSize(30),
    borderColor: '#d4d4d4',
    iconStyle: {},
    totalWidth: calcSize(220),
    separatorWidth: 1,
    type: 'plus-minus',
    rounded: false,
    textColor: 'black',
    containerStyle: {},
    inputStyle: {},
    errorInputStyle: {
        backgroundColor: 'red',
        color: 'white'
    },
    initValue: 0,
    valueType: 'integer',
    value: null,
    minValue: null,
    maxValue: null,
    step: 1,
    upDownButtonsBackgroundColor: 'white',
    rightButtonBackgroundColor: 'white',
    leftButtonBackgroundColor: 'white',
    editable: true,
    validateOnBlur: true,
    reachMaxIncIconStyle: {},
    reachMaxDecIconStyle: {},
    reachMinIncIconStyle: {},
    reachMinDecIconStyle: {},
    keyboardType: 'numeric'
};
